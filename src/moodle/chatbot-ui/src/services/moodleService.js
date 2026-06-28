import { CONFIG } from "../configurations/endpoint";

export const moodleApi = {
  /**
   * Fetch course and assignment info from Moodle REST API
   * @param {Object} params - Moodle API parameters
   * @param {string} params.wstoken - Web service token
   * @param {string} params.wsfunction - Web service function
   * @param {string} params.moodlewsrestformat - Response format
   * @param {string} params.courseids - Course IDs array
   * @returns {Promise<Object>} Course and assignment data
   */
  getCourseAssignments: async (params) => {
    const body = new URLSearchParams(params).toString();

    const response = await fetch(CONFIG.API_MOODLE_SERVER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      // console.log('Moodle REST response JSON:', data);
      return data;
    } catch (err) {
      // console.log('Moodle REST response text:', text);
      throw new Error('Failed to parse Moodle API response', { cause: err });
    }
  },

  /**
   * Fetch current user info from Moodle REST API
   * Uses token from sessionStorage.chatbot_token and fixed parameters.
   * @returns {Promise<Object>} Current user info
   */
  getUserInfo: async () => {
    const token = sessionStorage.getItem('chatbot_token');
    const params = {
      wstoken: token,
      wsfunction: 'core_webservice_get_site_info',
      moodlewsrestformat: 'json',
    };
    const body = new URLSearchParams(params).toString();

    const response = await fetch(CONFIG.API_MOODLE_SERVER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      console.log('Moodle REST response JSON:', data);
      return data;
    } catch (err) {
      console.log('Moodle REST response text:', text);
      throw new Error('Failed to parse Moodle API response', { cause: err });
    }
  },
};
