# whiteboard 

Want to relax after a long and tiring day? Forget the grueling process of taking your phone or laptop out, unlocking it, opening a browser and then loading Blackboard or Piazza’s website to look for what you want. We bring to you Whiteboard, a voice enabled learning management system, powered by Amazon Alexa.

Our vision for Whiteboard was to provide a more natural interaction modality for performing everyday tasks like checking grades, checking the due date for the next deliverable, asking and answering questions on Piazza, etc. With voice being tooted as the next big platform and voice interaction for learning management still left unexplored, we look at bridging this gap with Whiteboard.

For details on our product setup, features, design process and more, check out our website: ``https://www.gautamkrishnan.com/projects/whiteboard``


## Getting started

1. Zip the following files and folders directly. This will create an Archive.zip
 - lib, node_modules, index.js, NOTICE.txt, package.json
 
2. The details on how to go about setting up the custom skill(defined by our code) in Alexa Skill Kit and link it to your AWS Account can be found in the following link. 
 ```https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/registering-and-managing-alexa-skills-in-the-developer-portal```
 
 3. Define the intents provide in Intents.txt on Amazon's Alexa Voice Service.
 
 ## How it works
 
Whiteboard is a voice-enabled learning management system that allows students and instructors to perform simple everyday tasks with voice commands. Amazon's intelligent voice assistant, Alexa, does the speech recognition for us. We create an Interaction Model defined by Intents, which contain different combinations of a speech command that the user can use to perform a task. For example, a user wanting to check his/her grades in a specific course can say `"what are my grades in {course}"`, `"check my grades in {course}"`, `what is my score in {course}` and several such equivalents. We define this Interaction Model in Amazon's Developer Console in a new custom Alexa Skill Set. 

When Alexa hears these commands, the intent associated with that specific command gets fired. The AWS Lambda service hosting the Node.js server responds to those intents by executing code for each of those intents. The AWS Lambda service account is linked to the Alexa Skill Set that we created in the previous step. For Amazon Alexa Node.js Skill Developer Resources, refer to this URL ``https://github.com/alexa/skill-sample-nodejs-howto``

We use Piazza's API, which is available as an ``npm`` module, to perform specific tasks on Piazza like posting a question/note, answering unresolved questions, posting anonymously, etc. The source to Piazza's API can be found at ``https://github.com/dyhwong/piazza-api``.

Blackboard provides a REST API for use by developers. You can read more about it here ``https://developer.blackboard.com/portal/displayApi``. The REST API provides a JSON object in the following format.

```json
{
   "CS 522": {
      "hw3": {
         "value": 100,
         "average": 77,
         "median": 94
      },
      "overall": {
         "value": 94.16,
         "average": 83.14,
         "median": 89.15
      },
      "content": [
         {
            "content_id": "Homework 3",
            "due_date": "4th April 2017",
            "due_time": "12:00 AM"
         },
         {
            "content_id": "HomeWork 2",
            "due_date": "16th February 2017",
            "due_time": "12:00 AM"
         }
      ]
   },
   "CS 477": {
      "final": {
         "value": 96,
         "average": 81,
         "median": 83
      },
      "overall": {
         "value": 96,
         "average": 78,
         "median": 81
      }
   }
}
```

We use this JSON data to perform tasks with Blackboard.
