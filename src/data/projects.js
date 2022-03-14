// TODO Add a couple lines about each project
const data = [
  {
    title: 'Storytelling Chatbot',
    link: 'https://www.youtube.com/watch?v=6PN6YoK72Kg',
    image: '/images/projects/chatbot.PNG',
    date: '2021-05-10',
    desc:
    'In this lab, after learning about Typescript and creating chatbots on Telegram, we had to create our own story. As I am not very good at creative writing, I decided to create an AI, which will do that work instead of me.',
  },
  {
    title: 'Neural Circuits',
    codeplatform: 'GitHub link',
    codelink: 'https://github.com/AniPetrosyan/NeuralCircuits-Neuronify/blob/main/8f5dec96-f9d9-464e-b8e2-14c1467b3819.1280x1280.jpg',
    link: 'https://github.com/AniPetrosyan/NeuralCircuits-Neuronify/blob/main/8f5dec96-f9d9-464e-b8e2-14c1467b3819.1280x1280.jpg',
    image: '/images/projects/NeuralCircuits.jpg',
    date: '2021-01-20',
    desc:
    'This is what I created while exploring Neuronify. I always wondered how our brain is working and what neurons do. And I always wanted to create my own artificial neural network using the tools at hand.\n'
    + 'I tried to show what happens with neural circuits when a sensation turns into a motor function.'
    + " I created a neural circuit for the case when anyone plays chess (as it's one of my favorite hobbies). Now it's your turn to do the next step in chess and your brain starts to think about how to do the next best step.Built for a social impact hackathon. ",
  },
  {
    title: 'Computational Ornaments',
    codeplatform: 'GitHub link',
    codelink: 'https://github.com/AniPetrosyan/Computational-Ornaments',
    link: 'https://github.com/AniPetrosyan/Computational-Ornaments',
    image: '/images/projects/processing.gif',
    date: '2019-09-01',
    desc:
    "This was my first work that merged graphic design and programming to create generative graphics inspired by Armenia's ornamental heritage. My teammate graphic designer and I began this project by scouring the city of Yerevan for ornaments and taking charcoal rubs to record them. We chose a sidewalk pattern on Tigran Mets Avenue, a shape adorning a door to the Opera House, and a carving on Alexander Tamanyan’s statue. The graphic designer used Adobe Illustrator to transform the charcoal rubbing into a digital pattern."
    + 'I used the Processing programming language to turn the digital pattern into a generative graphic. '
    + ' Imagine your camera is working but you see yourself with patterns. You can see such result with images in the "Results" folder in the Github link I wrote where I posted some pictures. You can also see the screenshot of the post which Tumo posted on their website about our project.',
  },
  {
    title: 'Sorting Robot',
    image: '/images/projects/robot.jpg',
    date: '2019-01-12',
    desc:
    "I was an assistant at the Robotics Workshop in Tumo in 2019. There was one more assistant with me. The students were using lots of different legos to make their robots. But after every class, it was needed to put those legos back in a sorted way for the next session's students. And the workshop leader was always giving us the task to sort the different parts of the lego robots. It was a very boring task and my friend and I decided to make a robot as a solution for this. "
    + 'Our robot sorts different legos and puts them in different places. '
    + 'Firstly, we made a 3D model for all the lego types. After that, we printed it with our 3D printer. You can see it under the green thing. Then we made our robot with different legos. '
    + 'We made the green thing with the 3D printer as well. In the green thing, we put different legos which are not sorted and the robot starts to move from left to right. As a result, every lego starts to fall from its place down to the red box.',
  },
  {
    title: 'NLP Classification Task: Sarcasm_Detection',
    codeplatform: 'GitHub link',
    codelink: 'https://github.com/AniPetrosyan/Sarcasm-Detection',
    link: 'https://youtu.be/UPA2Vu8d8nM',
    image: '/images/projects/sarcasm.PNG',
    date: '2021-06-15',
    desc:
    "I used the skills I've learned in the learning lab of Shahbaz Mogal from Microsoft to create and train deep learning models from scratch on a classification task. The final work was sarcasm detection· I used neural networks used in AI, concepts like loss, back-propagation, Pytorch, standard NLP workflow (tokenization, POS tagging, etc.) and tested the model."
    + 'The model can detect sarcasm in any language. My mentor Shahbaz helped me to find the dataset. '
    + 'In the video, I test the model in Armenian because there are only a few models which understand Armenian.'
    + 'Here is what I wrote in Armenian: '
    + '1) The teacher learns more from his student than the student learns from the teacher - 93.26% sarcastic and 6.74% not sarcastic.'
    + '2) I love my mother - 2.08% sarcastic and 97.92% not sarcastic.'
    + ' Before pushing my code to Github I wrote: "Ani is the best programmer" - 31.29% sarcastic, 68.71% not sarcastic :)',
  },
  {
    title: 'Image Morphing',
    codeplatform: 'GitHub link',
    codelink: 'https://github.com/AniPetrosyan/Image-Processing',
    link: 'https://youtu.be/7pACUDZkKC0',
    image: '/images/projects/imagemorphing.PNG',
    date: '2020-04-15',
    desc:
    "This is a project from Princeton graduate Narek Galstyan's lab. Our team was working on creating something like a little photoshop. There are several filters in this, let's say little photoshop, and every student was assigned to implement one. My part was the Image Morphing part. In the video, you can see my work's result in the end, which is like a gif that shows Trump's one image into another through a seamless transition. I used JavaScript to implement this project.",
  },
  {
    title: 'Signal Processing Using Python',
    codeplatform: 'GitHub link',
    codelink: 'https://github.com/AniPetrosyan/SignalProcessingUsingPython',
    link: 'https://youtu.be/LNFE6AO31QY',
    image: '/images/projects/signalprocessing.PNG',
    date: '2021-01-15',
    desc:
    "The lab of MIT graduate Lara Shonkwiller was about generating sound and music in Python. We primarily used Numpy library. The creative part of this lab was creating music. We created Python program that took the medipitch notation and turned it into an actual sound. Music processing isn't talked about much in school often but I discovered that there is really very interesting math and science that goes into it. Lara taught us Signal Processing, we did different assignments which you can see in the Github link. However, I was the only student at the lab who completed the exercise 8th. You can see the result of exercise 8's in the video. ",
  },

  {
    title: 'Exploring Our Community through the Lens of Data Visualization',
    link: 'https://arcg.is/1TPzz10',
    image: '/images/projects/tableau.png',
    date: '2022-01-15',
    desc: " ",

  },

  {
    title: 'Candor',
    link: 'https://play.google.com/store/apps/details?id=com.Candor.Candor&hl=en&gl=US',
    image: '/images/projects/candor.PNG',
    date: '2020-12-10',
    desc:
    'As a participant of the Justice Accelerator program, our team decided to create a game and publish it in Google Play. I was the only programmer in our team and I created the "Candor" game. I used Unity and C#. In our game, you can choose either Judge or Hacker profession and understand how their life is going, by answering situational questions. In the end, our machine learning model says how much your chosen profession suits you. The game has 150+ installs.',
  },

];

export default data;
