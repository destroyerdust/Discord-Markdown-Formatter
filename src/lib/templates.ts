/**
 * Message templates for common Discord formatting patterns
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'announcement' | 'rules' | 'interactive' | 'formatting';
  content: string;
}

export const TEMPLATES: Template[] = [
  // Announcements
  {
    id: 'announcement-basic',
    name: 'Basic Announcement',
    description: 'Simple announcement with header and body',
    category: 'announcement',
    content: `# Announcement

**Important update for the community!**

Here's what you need to know:
- Point one
- Point two
- Point three

Questions? Ask in the support channel!`,
  },
  {
    id: 'announcement-event',
    name: 'Event Announcement',
    description: 'Event with date, time, and details',
    category: 'announcement',
    content: `# Event Announcement

**What:** Event Name
**When:** <t:${Math.floor(Date.now() / 1000) + 86400}:F>
**Where:** #channel-name

## Details
Description of the event goes here.

## How to Participate
1. Step one
2. Step two
3. Step three

React with a reaction if you're attending!`,
  },
  {
    id: 'announcement-update',
    name: 'Server Update',
    description: 'Changelog-style update announcement',
    category: 'announcement',
    content: `# Server Update

**Version/Date:** v1.0 - <t:${Math.floor(Date.now() / 1000)}:D>

## What's New
- New feature or change
- Another improvement

## Bug Fixes
- Fixed issue with X
- Resolved problem Y

## Coming Soon
- Upcoming feature
- Future plans

Thanks for being part of our community!`,
  },

  // Rules
  {
    id: 'rules-basic',
    name: 'Server Rules',
    description: 'Standard server rules format',
    category: 'rules',
    content: `# Server Rules

Please read and follow these rules to keep our community friendly and safe.

**1. Be Respectful**
Treat everyone with respect. No harassment, hate speech, or discrimination.

**2. No Spam**
Avoid excessive messages, caps, or emojis. No self-promotion without permission.

**3. Stay On Topic**
Use the appropriate channels for your discussions.

**4. No NSFW Content**
Keep all content appropriate for all ages.

**5. Follow Discord ToS**
Adhere to Discord's Terms of Service and Community Guidelines.

Breaking these rules may result in warnings, mutes, or bans.`,
  },
  {
    id: 'rules-numbered',
    name: 'Numbered Rules',
    description: 'Compact numbered rules list',
    category: 'rules',
    content: `# Community Guidelines

> **Rule 1:** Be kind and respectful to all members
> **Rule 2:** No spam, advertising, or self-promotion
> **Rule 3:** Keep discussions in appropriate channels
> **Rule 4:** No NSFW or inappropriate content
> **Rule 5:** No sharing personal information
> **Rule 6:** Listen to moderators and staff
> **Rule 7:** Have fun and enjoy your stay!

*Violations may result in warnings or bans.*`,
  },

  // Interactive
  {
    id: 'poll-simple',
    name: 'Simple Poll',
    description: 'Basic poll with reaction voting',
    category: 'interactive',
    content: `# Poll: Your Question Here?

React to vote!

Option A - Description
Option B - Description
Option C - Description

*Voting ends <t:${Math.floor(Date.now() / 1000) + 86400}:R>*`,
  },
  {
    id: 'spoiler-reveal',
    name: 'Spoiler Content',
    description: 'Hidden content with spoiler tags',
    category: 'interactive',
    content: `# Spoiler Warning!

The following contains spoilers for **[Title]**.

Click to reveal: ||Your spoiler content goes here. This text will be hidden until the reader clicks on it.||

**Additional hidden content:**
||Another spoiler that readers can reveal separately.||`,
  },
  {
    id: 'qa-format',
    name: 'Q&A Format',
    description: 'Question and answer style',
    category: 'interactive',
    content: `# Frequently Asked Questions

**Q: First question here?**
> A: Answer to the first question with details.

**Q: Second question here?**
> A: Answer to the second question.

**Q: Third question here?**
> A: Answer to the third question.

*Have more questions? Ask in the support channel!*`,
  },

  // Formatting Examples
  {
    id: 'formatting-showcase',
    name: 'Formatting Showcase',
    description: 'Demonstrates all formatting options',
    category: 'formatting',
    content: `# Text Formatting Demo

**Bold text** for emphasis
*Italic text* for style
__Underlined text__ for importance
~~Strikethrough~~ for corrections
||Spoiler text|| for hidden content

## Combined Styles
***Bold and italic***
__**Underline and bold**__
~~**Strikethrough and bold**~~

## Code
Inline \`code\` for commands
\`\`\`js
// Code block with syntax highlighting
const greeting = "Hello, Discord!";
console.log(greeting);
\`\`\`

## Quotes and Lists
> This is a block quote
> It can span multiple lines

- Bullet point one
- Bullet point two
  - Nested item

## Links
[Masked link text](https://example.com)`,
  },
  {
    id: 'code-snippet',
    name: 'Code Snippet',
    description: 'Formatted code with explanation',
    category: 'formatting',
    content: `# Code Example

**Description:** Brief explanation of what this code does.

\`\`\`js
// Your code here
function example() {
  return "Hello, World!";
}
\`\`\`

**Usage:**
\`\`\`
example()
\`\`\`

**Output:**
\`\`\`
Hello, World!
\`\`\``,
  },
  {
    id: 'welcome-message',
    name: 'Welcome Message',
    description: 'New member welcome template',
    category: 'formatting',
    content: `# Welcome to the Server!

Hey there, **new member**! We're glad to have you here.

## Getting Started
1. Read the rules in #rules
2. Introduce yourself in #introductions
3. Pick your roles in #roles

## Useful Channels
- #general - Chat with the community
- #help - Get assistance
- #announcements - Stay updated

## Need Help?
Feel free to ask any questions. Our staff and community are here to help!

Enjoy your stay!`,
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: Template['category']): Template[] {
  return TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): { id: Template['category']; name: string }[] {
  return [
    { id: 'announcement', name: 'Announcements' },
    { id: 'rules', name: 'Rules & Guidelines' },
    { id: 'interactive', name: 'Interactive' },
    { id: 'formatting', name: 'Formatting Examples' },
  ];
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
