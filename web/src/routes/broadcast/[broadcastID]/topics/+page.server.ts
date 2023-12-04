import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const id = Number(params.broadcastID);
  if (isNaN(id)) {
    throw new Error('expected valid broadcast id');
  }

  const broadcast = await db.broadcast.findUniqueOrThrow({ where: { id }, select: { topics: true } });

  return { topics: broadcast.topics };
};

export const actions = {
  'delete-topic': async ({ params, request }) => {
    const id = Number(params.broadcastID);
    if (isNaN(id)) {
      throw new Error('expected valid broadcast id');
    }

    const data = await request.formData();
    const topicID = Number(data.get('topic-id'));
    if (isNaN(topicID)) {
      return fail(400, { error: 'expected topic id' });
    }

    await db.topic.delete({ where: { id: topicID } });

    return {};
  },
} satisfies Actions;
