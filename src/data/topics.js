import { searchEntries, topicSlug } from './search';
import topicDescriptions from './topic-definitions';

const topics = Object.entries(topicDescriptions)
  .map(([name, description]) => ({
    name,
    slug: topicSlug(name),
    description,
    entries: searchEntries.filter((entry) => entry.topics.includes(name)),
  }))
  .filter((topic) => topic.entries.length > 0)
  .sort((a, b) => a.name.localeCompare(b.name));

const findTopic = (slug) => topics.find((topic) => topic.slug === slug);

export { findTopic, topics };
