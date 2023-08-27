// TODO Add a couple lines about each project
const data = [
  {
    title: 'Birthday - Turning 24',
    image: 'images/pictures/bitrthday.jpeg',
    date: '2023-07-25',
    link: 'https://doshidhruv.com',
    desc:
      'Picture at home, turning 24!!',
  },
  {
    title: 'Stanley Park',
    image: 'images/pictures/dhruv_vancouver.jpg',
    date: '2023-08-12',
    link: 'https://goo.gl/maps/wGw2WNNEXwfcnURE6',
    desc:
      'Stanley Park, located in Vancouver, is a renowned urban park known for its lush forests, scenic seawall, diverse wildlife, and attractions.',
  },
  {
    title: 'Banff Gandola Trip ',
    image: '/images/pictures/all_banff_gandola.jpeg',
    date: '2023-08-15',
    link: 'https://goo.gl/maps/pPjfSkwFQC8uCysb7',
    desc:
      'The Banff Gondola offers stunning views of the Rocky Mountains and Banff National Park.',
  },
  {
    title: 'Lake Lousie',
    image: '/images/pictures/Banff.jpeg',
    date: '2023-08-15',
    link: 'https://goo.gl/maps/FXgmGFBhPVnLPvyF7',
    desc:
      'Lake Louise is stunning with turquoise waters surrounded by mountains.',
  },
  {
    title: 'Cipilano Suspension Bridge Park',
    image: 'images/pictures/dhruv_cipilano_park.jpeg',
    date: '2023-08-12',
    link: 'https://goo.gl/maps/HNG4unfVBE6NcsCq8',
    desc:
      'Capilano Suspension Bridge Park offers thrilling suspension bridges, treetop adventures, and nature walks in a stunning rainforest setting near Vancouver.',
  },
  {
    title: 'Cousins!',
    image: 'images/pictures/cousins.gif',
    date: '2023-07-25',
    link: 'https://goo.gl/maps/2qGazEoxC66XLXga7',
    desc:
      'Toronto Islands a trip with cousins!',
  },
  {
    title: 'Beach Day in Toronto',
    image: 'images/pictures/Dhurv Cabana.jpeg',
    date: '2023-07-20',
    link: 'https://goo.gl/maps/7GSpktBa9SLMQZcD6',
    desc:
      'A beach day in toronto, Trying the shorts!!',
  },
  {
    title: 'Édifice Ernest-Cormier',
    image: 'images/pictures/dhruv_montreal_court.jpeg',
    date: '2023-06-21',
    link: 'https://goo.gl/maps/Yj2NGjm1aRZ3qMN4A',
    desc:
      'Édifice Ernest-Cormier is an iconic Art Deco building in Montreal, known for its architectural elegance and historical significance.',
  },
  {
    title: 'La Ronde',
    image: 'images/pictures/dhruv_montreal_park.jpeg',
    date: '2023-06-22',
    link: 'https://goo.gl/maps/cMcteBMGpf21kTnf7',
    desc:
      'La Ronde is a thrilling amusement park in Montreal, featuring roller coasters, entertainment, and family-friendly attractions on Île Sainte-Hélène.',
  },
  {
    title: 'Mont-Royal',
    image: 'images/pictures/dhruv_montreal_stairs.jpeg',
    date: '2023-06-21',
    link: 'https://goo.gl/maps/4MxixLnzxwNQ8tCc6',
    desc:
      'Mount Royal offers a natural escape in Montreal, with hiking trails, city views, and the iconic illuminated cross.',
  },
  {
    title: 'Sammed Shikharji Jain Tirth',
    image: 'images/pictures/dhruv_samet_shikharji.jpg',
    date: '2023-03-26',
    link: 'https://goo.gl/maps/V4TfdzdWQyWNaZRQA',
    desc:
      'Sammed Shikharji Jain Tirth is a revered pilgrimage site in India. It holds significance in Jainism, featuring sacred hills and temples visited by followers seeking spiritual enlightenment.',
  },
  {
    title: 'Playing with niece',
    image: '/images/pictures/dhruv_with_jia.jpeg',
    date: '2023-04-01',
    link: 'https://goo.gl/maps/DCrBHAVK6Grjgc7eA',
    desc:
      'Meeting my niece after long time, she has grown a lot since I met her!!',
  },
  {
    title: 'Family!',
    image: 'images/pictures/india_visit_family.jpeg',
    date: '2023-04-01',
    link: 'https://goo.gl/maps/DCrBHAVK6Grjgc7eA',
    desc:
      'Whole family in a single picture; visiting India after 2 years!!',
  },
  {
    title: 'Peggys Cove ',
    image: '/images/pictures/dhruv_peggys_cove.jpg',
    date: '2022-11-11',
    link: 'https://goo.gl/maps/NZzPEVoLRmKER4jF7',
    desc:
      'One day trip to the lighthouse near Halifax, Most photographed lighthouse in Canada.',
  },
  {
    title: 'Albro Lake - Halifax',
    image: '/images/pictures/dhruv_albro.jpeg',
    date: '2022-09-25',
    link: 'https://goo.gl/maps/9FUzvHnyG6v4z6Uw9',
    desc:
      'Unplanned visit to nearby Lake!',
  },
  {
    title: 'Dalhousie University - Convocation ',
    image: '/images/pictures/dhruv_convocation.jpeg',
    date: '2022-11-02',
    link: 'https://www.dal.ca/',
    desc:
      'Graduation Day - Masters of Applied Computer Science! ',
  },
  {
    title: 'McNab Islands',
    image: '/images/pictures/dhruv_mcnab_1.jpeg',
    date: '2022-10-16',
    link: 'https://goo.gl/maps/op4H1Xh151m5G7Zd9',
    desc:
      'Picture after 16 Km of Trek in isolated McNab Islands',
  },
  {
    title: 'Cabbot Trail - Cape Breton Islands',
    image: '/images/pictures/dhruv_capebreton_1.jpeg',
    date: '2022-08-01',
    link: 'https://goo.gl/maps/mkBs6PgSeF5DJCxk9',
    desc:
      'Most scenic park of Nova Scotia.',
  },
  {
    title: 'Streetside Image in Halifax',
    image: '/images/pictures/halifax_random_1.jpeg',
    date: '2022-10-15',
    link: 'https://goo.gl/maps/T9BPQYvH9VeSsajA8',
    desc:
      'A random shot with roommates on streets of Halifax',
  },
  {
    title: 'Putting Edge ',
    image: '/images/pictures/halifax_last_day.jpeg',
    date: '2022-12-02',
    link: 'https://www.puttingedge.com/locations/halifax/',
    desc:
      'The last place we visited in halifax before moving to Toronto',
  },
  {
    title: 'Holi Celebration - Dalhousie University',
    image: '/images/pictures/holi_dalhousie.jpeg',
    date: '2022-03-20',
    link: 'https://www.dal.ca/',
    desc:
      'Celebration of festival of colors with Indian society of Dalhousie University',
  },
  {
    title: 'Family Gathering',
    image: '/images/pictures/dada_birthday.gif',
    date: '2017-07-19',
    link: 'https://en.wikipedia.org/wiki/Ahmedabad',
    desc:
      'Grandfathers 75th Birthday Celebration',
  },
  {
    title: 'Random Cycling - Ahmedabad',
    image: '/images/pictures/dhruv_randon_cycle.jpg',
    date: '2017-07-19',
    link: 'https://en.wikipedia.org/wiki/Ahmedabad',
    desc:
      'A random evening cycling with friends!',
  },
  {
    title: 'Random dam near Ahmedabad',
    image: '/images/pictures/dhruv_skinny_fun.jpg',
    date: '2017-05-19',
    link: 'https://en.wikipedia.org/wiki/Ahmedabad',
    desc:
      'Disadvantages of being the skinny one in the group !!',
  },
  {
    title: 'Group Day 2017 - SilverOak',
    image: '/images/pictures/dhruv_group_day_2017.jpg',
    date: '2017-02-19',
    link: 'http://socet.edu.in/socet/',
    desc:
      'Group Day with Friends at first Tech Fest in SilverOak College',
  },
  {
    title: 'Laser Games - SilverOak',
    image: '/images/pictures/dhruv_laser_games.jpg',
    date: '2017-02-13',
    link: 'http://socet.edu.in/socet/',
    desc:
      'Laser Games with Friends at first Tech Fest in SilverOak College',
  },
];

// {
//   title: '',
//   image: '',
//   date: '',
//   link: '',
//   desc:
//     '',
// },

export default data;
