import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import * as auth from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (locals.session) {
		const sessionToken = cookies.get(auth.sessionCookieName);
		if (sessionToken) {
			await auth.logoutUser(sessionToken);
		}
		auth.deleteSessionTokenCookie({ cookies } as any);
	}
	
	redirect(302, '/login');
};