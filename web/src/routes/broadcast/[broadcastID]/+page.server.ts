import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  throw redirect(307, `/broadcast/${params.broadcastID}/topics`);
};
