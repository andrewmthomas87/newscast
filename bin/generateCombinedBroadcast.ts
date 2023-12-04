import { Prisma, PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AI } from '../ai';
import { db } from '../db';
import { JobPayload, JobPayloadSchema, JobType, claimJob, markJobCompleted, markJobFailed } from '../db/jobs';
import { getCombinedModifierFlags } from '../node_modules/typescript/lib/typescript';
import { Throttler } from '../utils/throttler';
import { generateTransitions } from './generateTransitions';
import { exec } from 'child_process';

const env = z
  .object({
    NEWSCAST_OPENAI_API_KEY: z.string().min(1),
    NEWSCAST_OPENAI_API_MODEL: z.string().min(1),
    NEWSCAST_OPENAI_API_THROTTLE_RPS: z.coerce.number().gt(0),
  })
  .parse(process.env);

const ai = new AI(
  env.NEWSCAST_OPENAI_API_KEY,
  env.NEWSCAST_OPENAI_API_MODEL,
  new Throttler(env.NEWSCAST_OPENAI_API_THROTTLE_RPS),
);

while (true) {
    const job = await claimJob(db, JobType.generateCombinedBroadcast);
    if (!job) {
      break;
    }


    console.log(`Claimed combine broadcast job ${job.id}`);

    try {
        const payload = JobPayloadSchema.generateCombinedBroadcast.parse(JSON.parse(job.payload));
        await generateCombinedBroadcast(ai, db, payload.broadcastID);
        await markJobCompleted(db, job.id);
    
        console.log(`Completed combine broadcast job ${job.id}`);
      } catch (ex) {
        console.error(ex);
        await markJobFailed(db, job.id);
        console.log(`Failed combine broadcast job ${job.id}`);
      }

}

console.log('No more combine broadcast jobs');


// Generate Combined Broadcast

async function generateCombinedBroadcast(ai: AI, db: PrismaClient, broadcastID: number) {
  try {

 //   const topicTransitions = await generateTransitions(ai, db, broadcastID);
 //   console.log("NECESSARY:", topicTransitions)
    // Retrieve broadcast topics with associated topic segments
    const broadcast = await db.broadcast.findUniqueOrThrow({
      where: { id: broadcastID },
      include: {
        topics: {
          include: {
            topicSegment: {
              include: {
                prevTransition: true,
                nextTransition: true,
                
              }
            },
          },
        },
      
      },
    });

    // ... rest of your code ...
    // const transition = db.broadcast
    // console.log("TRANSITION!:", transition)
    const arr = []
    const str = ""
    let finalText = ""
    console.log("BREAK")
    for (const topic of broadcast.topics) {
      console.log(" ")
      console.log(`Topic: ${topic.name}, ${topic.query}`);

      if (!topic.topicSegment) {
        console.log('No topic segment. Skipping...');
        continue;
      }

      // Access topicSegment data
      const prev = topic.topicSegment.prevTransition
      console.log("PREV:", prev)
      const next = topic.topicSegment.nextTransition
      console.log("NEXT:", next)
      const prevtransition = prev?.transition
      console.log("TRATRA:", prevtransition, next?.transition)

      let combined = ""
      
      if ((prev && next) || (prev)){
        combined = [topic.topicSegment?.body, prev?.transition].join('\n\n');
      } else{
        combined = [topic.topicSegment?.body].join('\n\n');
      }
      arr.push(combined)
      finalText = [finalText, combined].join('\n\n');
      
      console.log("COMBINED:", combined)
      console.log("ARR:", arr)


      // const { introduction, body, conclusion } = topic.topicSegment;
      // console.log(`TopicSegment: ${introduction}, ${body}, ${conclusion}`);
   //   console.log(topicTransitions)


      /*

      import { exec } from 'child_process';

        // Your TypeScript function that generates a string
        function generateString(): string {
          return 'Hello, Python!';
        }

        // Export the string to Python
        const jsonString = JSON.stringify({ data: generateString() });

        // Execute a Python script and pass the JSON string via stdin
        const pythonProcess = exec('python myPythonScript.py', (error, stdout, stderr) => {
          if (error) {
            console.error(`Error executing Python script: ${error}`);
            return;
          }
          console.log(`Python script output: ${stdout}`);
        });

        pythonProcess.stdin.write(jsonString);
        pythonProcess.stdin.end();


        import sys
        import json

        # Read JSON string from stdin
        json_string = sys.stdin.read()

        # Load JSON string into a Python object
        data = json.loads(json_string)

        # Extract the string
        my_string = data['data']

        # Print the string
        print(my_string)




      */
    }
    console.log(finalText)


        // Export the string to Python
    const jsonString = JSON.stringify({data: finalText});
    console.log("3")
    // Execute a Python script and pass the JSON string via stdin
    const pythonProcess = exec('python bin/NewsDemo.py', (error, stdout, stderr) => {
      console.log(`Python script output: ${stdout}`);
      console.error(`Python script error: ${stderr}`);
      if (error) {
        console.error(`Error executing Python script: ${error}`);
      }
    });

    console.log("1")
    // Check if stdin is not null before using it
    if (pythonProcess.stdin) {
      console.log("python")
      pythonProcess.stdin.write(jsonString);
      console.log("first")
      pythonProcess.stdin.end();
      
    } else {
      console.log("2")
      console.error('stdin is null or undefined');
    }

    console.log('Python script called'); 



  } catch (error) {
    console.error('Error generating combined broadcast:', error);
    throw error; // Rethrow the error for the caller to handle
  }

}