import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import * as auth from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(302, '/');
	}
	
	return {};
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();

		if (!email) {
			return {
				error: 'Email is required',
				email
			};
		}

		try {
			const { user, sessionToken } = await auth.loginUser(email);
			
			// loginUser already creates the session, we just need to set the cookie
			// Let's get session info to set proper expiry
			const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
			
			auth.setSessionTokenCookie(
				{ cookies } as any, 
				sessionToken, 
				sessionExpiry
			);

			redirect(302, '/');
		} catch (error) {
			console.error('Login error:', error);
			
			if (error instanceof auth.AuthError) {
				return {
					error: error.message,
					email
				};
			}
			
			return {
				error: 'An unexpected error occurred. Please try again.',
				email
			};
		}
	}
};