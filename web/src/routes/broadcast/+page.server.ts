import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const broadcasts = await db.broadcast.findMany({ orderBy: { createdAt: 'desc' } });

  return { broadcasts };
};

export const actions = {
  new: async () => {
    await db.broadcast.create({});

    return {};
  },

  delete: async ({ request }) => {
    const data = await request.formData();
    const broadcastID = Number(data.get('broadcast-id'));
    if (isNaN(broadcastID)) {
      return fail(400, { error: 'expected broadcast id' });
    }

    await db.broadcast.delete({ where: { id: broadcastID } });

    return {};
  },
} satisfies Actions;
