import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params }) => {
  const id = Number(params.broadcastID);
  if (isNaN(id)) {
    throw error(404);
  }

  const broadcast = await db.broadcast.findUnique({ where: { id } });
  if (!broadcast) {
    throw error(404);
  }

  return { broadcast };
};
