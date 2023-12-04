import { bingNewsAPI } from '$lib/bingNewsAPI/api.server';
import type { APITopic } from '$lib/bingNewsAPI/types';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const id = Number(params.broadcastID);
  if (isNaN(id)) {
    throw new Error('expected valid broadcast id');
  }

  const broadcast = await db.broadcast.findUniqueOrThrow({ where: { id }, select: { topics: true } });

  let trending = await bingNewsAPI.fetchTrendingTopics();

  const current = new Set(broadcast.topics.map((topic) => [topic.name, topic.query].join(':')));
  trending = trending.filter((trend) => {
    const isDuplicate = current.has([trend.name, trend.query.text].join(':'));
    return !isDuplicate;
  });

  return { trending };
};

export const actions = {
  default: async ({ params, request }) => {
    const id = Number(params.broadcastID);
    if (isNaN(id)) {
      throw new Error('expected valid broadcast id');
    }

    const data = await request.formData();
    // TODO: validation
    const trends = JSON.parse(data.get('trends') as string) as APITopic[];

    await db.broadcast.update({
      where: { id },
      data: {
        topics: {
          create: trends.map((trend) => {
            const { name, query } = trend;
            return { name, query: query.text };
          }),
        },
      },
    });

    throw redirect(303, `/broadcast/${id}/topics`);
  },
} satisfies Actions;
