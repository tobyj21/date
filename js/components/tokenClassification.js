"use strict";

const tokenClassifications = [
   {
      t: "a",
      r: 0,
   },
   {
      t: "about",
      r: 0,
   },
   {
      t: "above",
      r: 0,
   },
   {
      t: "acros",
      r: 0,
   },
   {
      t: "after",
      r: 0,
   },
   {
      t: "again",
      r: 0,
   },
   {
      t: "against",
      r: 0,
   },
   {
      t: "all",
      r: 0,
   },
   {
      t: "almost",
      r: 0,
   },
   {
      t: "along",
      r: 0,
   },
   {
      t: "already",
      r: 0,
   },
   {
      t: "also",
      r: 0,
   },
   {
      t: "although",
      r: 0,
   },
   {
      t: "alway",
      r: 0,
   },
   {
      t: "among",
      r: 0,
   },
   {
      t: "an",
      r: 0,
   },
   {
      t: "and",
      r: 0,
   },
   {
      t: "another",
      r: 0,
   },
   {
      t: "any",
      r: 0,
   },
   {
      t: "anybody",
      r: 0,
   },
   {
      t: "anyone",
      r: 0,
   },
   {
      t: "anyth",
      r: 0,
   },
   {
      t: "anywhere",
      r: 0,
   },
   {
      t: "are",
      r: 0,
   },
   {
      t: "around",
      r: 0,
   },
   {
      t: "a",
      r: 0,
   },
   {
      t: "at",
      r: 0,
   },
   {
      t: "be",
      r: 0,
   },
   {
      t: "because",
      r: 0,
   },
   {
      t: "before",
      r: 0,
   },
   {
      t: "behind",
      r: 0,
   },
   {
      t: "below",
      r: 0,
   },
   {
      t: "been",
      r: 0,
   },
   {
      t: "beside",
      r: 0,
   },
   {
      t: "between",
      r: 0,
   },
   {
      t: "beyond",
      r: 0,
   },
   {
      t: "both",
      r: 0,
   },
   {
      t: "but",
      r: 0,
   },
   {
      t: "by",
      r: 0,
   },
   {
      t: "can",
      r: 0,
   },
   {
      t: "could",
      r: 0,
   },
   {
      t: "did",
      r: 0,
   },
   {
      t: "do",
      r: 0,
   },
   {
      t: "doe",
      r: 0,
   },
   {
      t: "done",
      r: 0,
   },
   {
      t: "down",
      r: 0,
   },
   {
      t: "dur",
      r: 0,
   },
   {
      t: "each",
      r: 0,
   },
   {
      t: "either",
      r: 0,
   },
   {
      t: "enough",
      r: 0,
   },
   {
      t: "even",
      r: 0,
   },
   {
      t: "every",
      r: 0,
   },
   {
      t: "everybody",
      r: 0,
   },
   {
      t: "everyone",
      r: 0,
   },
   {
      t: "everyth",
      r: 0,
   },
   {
      t: "everywhere",
      r: 0,
   },
   {
      t: "far",
      r: 0,
   },
   {
      t: "few",
      r: 0,
   },
   {
      t: "for",
      r: 0,
   },
   {
      t: "from",
      r: 0,
   },
   {
      t: "front",
      r: 0,
   },
   {
      t: "further",
      r: 0,
   },
   {
      t: "get",
      r: 0,
   },
   {
      t: "go",
      r: 0,
   },
   {
      t: "had",
      r: 0,
   },
   {
      t: "ha",
      r: 0,
   },
   {
      t: "have",
      r: 0,
   },
   {
      t: "he",
      r: 0,
   },
   {
      t: "her",
      r: 0,
   },
   {
      t: "here",
      r: 0,
   },
   {
      t: "her",
      r: 0,
   },
   {
      t: "herself",
      r: 0,
   },
   {
      t: "him",
      r: 0,
   },
   {
      t: "himself",
      r: 0,
   },
   {
      t: "hi",
      r: 0,
   },
   {
      t: "how",
      r: 0,
   },
   {
      t: "i",
      r: 0,
   },
   {
      t: "if",
      r: 0,
   },
   {
      t: "in",
      r: 0,
   },
   {
      t: "inside",
      r: 0,
   },
   {
      t: "into",
      r: 0,
   },
   {
      t: "i",
      r: 0,
   },
   {
      t: "it",
      r: 0,
   },
   {
      t: "it",
      r: 0,
   },
   {
      t: "ive",
      r: 0,
   },
   {
      t: "im",
      r: 0,
   },
   {
      t: "just",
      r: 0,
   },
   {
      t: "know",
      r: 0,
   },
   {
      t: "known",
      r: 0,
   },
   {
      t: "last",
      r: 0,
   },
   {
      t: "later",
      r: 0,
   },
   {
      t: "least",
      r: 0,
   },
   {
      t: "les",
      r: 0,
   },
   {
      t: "let",
      r: 0,
   },
   {
      t: "like",
      r: 0,
   },
   {
      t: "little",
      r: 0,
   },
   {
      t: "long",
      r: 0,
   },
   {
      t: "made",
      r: 0,
   },
   {
      t: "make",
      r: 0,
   },
   {
      t: "many",
      r: 0,
   },
   {
      t: "may",
      r: 0,
   },
   {
      t: "me",
      r: 0,
   },
   {
      t: "might",
      r: 0,
   },
   {
      t: "mine",
      r: 0,
   },
   {
      t: "more",
      r: 0,
   },
   {
      t: "most",
      r: 0,
   },
   {
      t: "much",
      r: 0,
   },
   {
      t: "must",
      r: 0,
   },
   {
      t: "my",
      r: 0,
   },
   {
      t: "myself",
      r: 0,
   },
   {
      t: "near",
      r: 0,
   },
   {
      t: "nearly",
      r: 0,
   },
   {
      t: "never",
      r: 0,
   },
   {
      t: "next",
      r: 0,
   },
   {
      t: "no",
      r: 0,
   },
   {
      t: "nobody",
      r: 0,
   },
   {
      t: "none",
      r: 0,
   },
   {
      t: "nor",
      r: 0,
   },
   {
      t: "not",
      r: 0,
   },
   {
      t: "noth",
      r: 0,
   },
   {
      t: "now",
      r: 0,
   },
   {
      t: "of",
      r: 0,
   },
   {
      t: "off",
      r: 0,
   },
   {
      t: "often",
      r: 0,
   },
   {
      t: "on",
      r: 0,
   },
   {
      t: "once",
      r: 0,
   },
   {
      t: "one",
      r: 0,
   },
   {
      t: "only",
      r: 0,
   },
   {
      t: "or",
      r: 0,
   },
   {
      t: "other",
      r: 0,
   },
   {
      t: "our",
      r: 0,
   },
   {
      t: "our",
      r: 0,
   },
   {
      t: "ourselve",
      r: 0,
   },
   {
      t: "out",
      r: 0,
   },
   {
      t: "over",
      r: 0,
   },
   {
      t: "own",
      r: 0,
   },
   {
      t: "quite",
      r: 0,
   },
   {
      t: "rather",
      r: 0,
   },
   {
      t: "really",
      r: 0,
   },
   {
      t: "right",
      r: 0,
   },
   {
      t: "said",
      r: 0,
   },
   {
      t: "same",
      r: 0,
   },
   {
      t: "saw",
      r: 0,
   },
   {
      t: "say",
      r: 0,
   },
   {
      t: "see",
      r: 0,
   },
   {
      t: "seem",
      r: 0,
   },
   {
      t: "seen",
      r: 0,
   },
   {
      t: "several",
      r: 0,
   },
   {
      t: "shall",
      r: 0,
   },
   {
      t: "she",
      r: 0,
   },
   {
      t: "should",
      r: 0,
   },
   {
      t: "since",
      r: 0,
   },
   {
      t: "so",
      r: 0,
   },
   {
      t: "some",
      r: 0,
   },
   {
      t: "somebody",
      r: 0,
   },
   {
      t: "someone",
      r: 0,
   },
   {
      t: "someth",
      r: 0,
   },
   {
      t: "sometime",
      r: 0,
   },
   {
      t: "sometime",
      r: 0,
   },
   {
      t: "somewhere",
      r: 0,
   },
   {
      t: "still",
      r: 0,
   },
   {
      t: "such",
      r: 0,
   },
   {
      t: "take",
      r: 0,
   },
   {
      t: "than",
      r: 0,
   },
   {
      t: "that",
      r: 0,
   },
   {
      t: "the",
      r: 0,
   },
   {
      t: "their",
      r: 0,
   },
   {
      t: "their",
      r: 0,
   },
   {
      t: "them",
      r: 0,
   },
   {
      t: "themselve",
      r: 0,
   },
   {
      t: "then",
      r: 0,
   },
   {
      t: "there",
      r: 0,
   },
   {
      t: "these",
      r: 0,
   },
   {
      t: "they",
      r: 0,
   },
   {
      t: "th",
      r: 0,
   },
   {
      t: "thing",
      r: 0,
   },
   {
      t: "think",
      r: 0,
   },
   {
      t: "thi",
      r: 0,
   },
   {
      t: "those",
      r: 0,
   },
   {
      t: "though",
      r: 0,
   },
   {
      t: "three",
      r: 0,
   },
   {
      t: "through",
      r: 0,
   },
   {
      t: "thu",
      r: 0,
   },
   {
      t: "to",
      r: 0,
   },
   {
      t: "together",
      r: 0,
   },
   {
      t: "too",
      r: 0,
   },
   {
      t: "two",
      r: 0,
   },
   {
      t: "under",
      r: 0,
   },
   {
      t: "until",
      r: 0,
   },
   {
      t: "unto",
      r: 0,
   },
   {
      t: "up",
      r: 0,
   },
   {
      t: "upon",
      r: 0,
   },
   {
      t: "u",
      r: 0,
   },
   {
      t: "very",
      r: 0,
   },
   {
      t: "want",
      r: 0,
   },
   {
      t: "wa",
      r: 0,
   },
   {
      t: "way",
      r: 0,
   },
   {
      t: "we",
      r: 0,
   },
   {
      t: "well",
      r: 0,
   },
   {
      t: "were",
      r: 0,
   },
   {
      t: "what",
      r: 0,
   },
   {
      t: "when",
      r: 0,
   },
   {
      t: "where",
      r: 0,
   },
   {
      t: "which",
      r: 0,
   },
   {
      t: "while",
      r: 0,
   },
   {
      t: "who",
      r: 0,
   },
   {
      t: "whom",
      r: 0,
   },
   {
      t: "whose",
      r: 0,
   },
   {
      t: "why",
      r: 0,
   },
   {
      t: "will",
      r: 0,
   },
   {
      t: "with",
      r: 0,
   },
   {
      t: "within",
      r: 0,
   },
   {
      t: "without",
      r: 0,
   },
   {
      t: "work",
      r: 0,
   },
   {
      t: "would",
      r: 0,
   },
   {
      t: "ye",
      r: 0,
   },
   {
      t: "yet",
      r: 0,
   },
   {
      t: "you",
      r: 0,
   },
   {
      t: "your",
      r: 0,
   },
   {
      t: "yourself",
      r: 0,
   },
   {
      t: "yourselve",
      r: 0,
   },
   {
      t: "unable",
      r: 0,
   },
   {
      t: "problem",
      r: 0,
   },
   {
      t: "guidance",
      r: 0,
   },
   {
      t: "support",
      r: 0,
   },
   {
      t: "via",
      r: 0,
   },
   {
      t: "help",
      r: 0,
   },
   {
      t: "issue",
      r: 0,
   },
   {
      t: "general",
      r: 0,
   },
   {
      t: "event",
      r: 0,
   },
   {
      t: "difficulty",
      r: 0,
   },
   {
      t: "difficult",
      r: 0,
   },
   {
      t: "difficultie",
      r: 0,
   },
   {
      t: "advice",
      r: 0,
   },
   {
      t: "advocacy",
      r: 0,
   },
   {
      t: "phone",
      r: 0,
   },
   {
      t: "chat",
      r: 0,
   },
   {
      t: "befriend",
      r: 0,
   },
   {
      t: "provider",
      r: 0,
   },
   {
      t: "peer",
      r: 0,
   },
   {
      t: "information",
      r: 0,
   },
   {
      t: "info",
      r: 0,
   },
   {
      t: "resource",
      r: 0,
   },
   {
      t: "signpost",
      r: 0,
   },
   {
      t: "train",
      r: 0,
   },
   {
      t: "service",
      r: 0,
   },
   {
      t: "app",
      r: 0,
   },
   {
      t: "tailor",
      r: 0,
   },
   {
      t: "activitie",
      r: 0,
   },
   {
      t: "acces",
      r: 1,
   },
   {
      t: "access",
      r: 1,
   },
   {
      t: "free",
      r: 1,
   },
   {
      t: "afford",
      r: 1,
   },
   {
      t: "find",
      r: 1,
   },
   {
      t: "cost",
      r: 1,
   },
   {
      t: "avoid",
      r: 1,
   },
   {
      t: "low",
      r: 1,
   },
   {
      t: "management",
      r: 1,
   },
   {
      t: "manag",
      r: 1,
   },
];
