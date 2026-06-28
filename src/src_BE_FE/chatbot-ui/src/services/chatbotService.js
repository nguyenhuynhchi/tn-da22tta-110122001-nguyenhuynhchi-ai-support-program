import httpClient from "../configurations/httpClient";
import { ENDPOINTS } from "../configurations/endpoint";

export const chatbotApi = {
  /**
   * Fetch chat suggestions from chatbot backend
   * @param {Object} params - Chat suggest parameters
   * @param {string} params.courseids - Course IDs
   * @param {string} [params.assignmentid] - Assignment ID (optional)
   * @param {string} [params.cmid] - Course module ID (optional)
   * @returns {Promise<Object>} Suggestion data
   */
  getChatSuggestions: async (params) => {
    const body = new URLSearchParams(params).toString();

    const response = await httpClient.post(ENDPOINTS.SUGGEST, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      transformRequest: [(data) => data],
    });

    const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    try {
      const data = JSON.parse(text);
      // console.log('Chat suggest response JSON:', data);
      return data;
    } catch {
      // console.log('Chat suggest response text:', text);
      // API trả về text thay vì JSON
      return { suggestion: text };
    }
  },

  /**
   * Fetch submitted source files for a student assignment
   * @param {string} params.wstoken 
   * @param {string} [params.assignmentid]
   * @param {string} params.userId
   */
  getSubmittedCode: async (params) => {
    // Use the local submit API as requested
    const body = new URLSearchParams(params).toString();

    const response = await httpClient.post(ENDPOINTS.GET_SUBMIT_JSON, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      transformRequest: [(data) => data],
    });

    return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  },

  /**
 * Request code analysis
 * @param {Object} params
 * @param {string} params.courseId
 * @param {string} params.assignmentId
 * @param {string} params.cmid
 * @param {string} params.userId
 * @param {File[]} files
 */
  analyzeSubmittedCode: async (params, files = []) => {
    const formData = new FormData();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await httpClient.post(ENDPOINTS.ANALYSIS, formData, {
      transformRequest: [(data) => data],
    });

    return typeof response.data === "string"
      ? response.data
      : JSON.stringify(response.data);
  },

  /**
   * Send a chat message to the chatbot backend
   * @param {string} message - User message text
   * @param {string} cmid - Course module ID
   * @param {string} userId - User ID
   * @returns {Promise<string|Object>} Raw chatbot response
   */
  sendSuggestMessage: async (message, cmid, userId) => {
    const response = await httpClient.post(ENDPOINTS.CHAT_SUGGEST, { message, cmid, userId });
    return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  },

  /**
 * Send a chat message to the chatbot backend
 * @param {string} message - User message text
 * @param {string} cmid - Course module ID
 * @param {string} userId - User ID
 * @returns {Promise<string|Object>} Raw chatbot response
 */
  sendAnalysisMessage: async (message, courseId, assignmentId, cmid, userId, images = []) => {
    const formData = new FormData();

    formData.append(
      "request",
      JSON.stringify({ message, courseId, assignmentId, cmid, userId })
    );

    images.forEach((image) => {
      formData.append("images", image);
    });

    const response = await httpClient.post(
      ENDPOINTS.CHAT_ANALYSIS,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },

  /**
 * Get a chat message 
 * @param {string} userId - User ID
 * @param {string} cmid - Course module ID
 * @param {string} conversationType - Conversation type (suggest or analysis)
 * @returns {Promise<Array>} List of chat messages
 */
  getMessages: async (cmid, userId, conversationType) => {
    const response = await httpClient.get(ENDPOINTS.GET_MESSAGES, {
      params: {
        cmid,
        userId,
        conversationType,
      },
    });

    return response.data;
  },

};
