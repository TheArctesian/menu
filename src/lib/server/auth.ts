import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const ALLOWED_EMAIL_DOMAIN = '@danielokita.com';

export const sessionCookieName = 'auth-session';

export class AuthError extends Error {
	constructor(message: string, public code: string = 'AUTH_ERROR') {
		super(message);
		this.name = 'AuthError';
	}
}

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

export async function createSession(token: string, userId: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: table.Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
	};
	await db.insert(table.session).values(session);
	return session;
}

export async function validateSessionToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const [result] = await db
		.select({
			// Adjust user table here to tweak returned data
			user: { id: table.user.id, username: table.user.username, email: table.user.email },
			session: table.session
		})
		.from(table.session)
		.innerJoin(table.user, eq(table.session.userId, table.user.id))
		.where(eq(table.session.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}
	const { session, user } = result;

	const sessionExpired = Date.now() >= session.expiresAt.getTime();
	if (sessionExpired) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;
	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		await db
			.update(table.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(table.session.id, session.id));
	}

	return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
	await db.delete(table.session).where(eq(table.session.id, sessionId));
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: '/'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, {
		path: '/'
	});
}

function generateUserId(): string {
	return crypto.getRandomValues(new Uint32Array(4)).join('');
}

function extractUsernameFromEmail(email: string): string {
	return email.split('@')[0];
}

export function validateEmail(email: string): boolean {
	if (!email || typeof email !== 'string') {
		return false;
	}
	
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email) && email.endsWith(ALLOWED_EMAIL_DOMAIN);
}

export async function createUser(email: string): Promise<table.User> {
	if (!validateEmail(email)) {
		throw new AuthError('Only @danielokita.com emails are allowed', 'INVALID_EMAIL_DOMAIN');
	}

	try {
		// Check if user already exists
		const [existingUser] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.email, email));

		if (existingUser) {
			throw new AuthError('User already exists', 'USER_EXISTS');
		}

		const userId = generateUserId();
		const username = extractUsernameFromEmail(email);

		const user: typeof table.user.$inferInsert = {
			id: userId,
			username,
			email,
			age: null
		};

		const [savedUser] = await db.insert(table.user).values(user).returning();
		
		if (!savedUser) {
			throw new AuthError('Failed to create user', 'USER_CREATE_FAILED');
		}

		return savedUser;
	} catch (error) {
		if (error instanceof AuthError) {
			throw error;
		}
		console.error('Error creating user:', error);
		throw new AuthError('Failed to create user');
	}
}

export async function loginUser(email: string): Promise<{ user: table.User; sessionToken: string }> {
	if (!validateEmail(email)) {
		throw new AuthError('Only @danielokita.com emails are allowed', 'INVALID_EMAIL_DOMAIN');
	}

	try {
		// Find existing user or create new one
		let [user] = await db
			.select()
			.from(table.user)
			.where(eq(table.user.email, email));

		if (!user) {
			user = await createUser(email);
		}

		// Create session
		const sessionToken = generateSessionToken();
		await createSession(sessionToken, user.id);

		return { user, sessionToken };
	} catch (error) {
		if (error instanceof AuthError) {
			throw error;
		}
		console.error('Error logging in user:', error);
		throw new AuthError('Failed to log in user');
	}
}

export async function logoutUser(sessionToken: string): Promise<void> {
	try {
		const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(sessionToken)));
		await invalidateSession(sessionId);
	} catch (error) {
		console.error('Error logging out user:', error);
		throw new AuthError('Failed to log out user');
	}
}
