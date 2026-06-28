export const CONFIG = {
   API: "http://localhost:8080/chatbot/api",
   API_MOODLE_SERVER: "http://moodle.local/moodle/webservice/rest/server.php",
};

export const ENDPOINTS = {
   // Chatbot API
   CHAT_SUGGEST: "/chat-suggest", // POST
   CHAT_ANALYSIS: "/chat-analysis", // POST

   GET_MESSAGES: "/get-message", // GET

   GET_SUBMIT_JSON: "/get-submit-json", // POST

   SUGGEST: "/suggest-assignment", // POST
   ANALYSIS: "/analysis-code", // POST
};