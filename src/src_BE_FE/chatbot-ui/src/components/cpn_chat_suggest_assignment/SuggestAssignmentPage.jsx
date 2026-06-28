import { useEffect, useState } from "react";
import ChatContent from "./ChatSuggestPanel";
import SideBar from "./SideBar";
import { moodleApi } from "../../services/moodleService";
import { chatbotApi } from "../../services/chatbotService";

const chatSuggestInitKeys = new Set();
const getCmidFromUrl = () => {
  const normalizedSearch = window.location.search.replace(/&amp;/g, "&");
  const params = new URLSearchParams(normalizedSearch);
  return params.get('cmid') || params.get('amp;cmid');
};

function Chatbot() {
  const [moodleInfo, setMoodleInfo] = useState(null);
  const [suggestInfo, setSuggestInfo] = useState(null);
  const [userId, setUserId] = useState(null);
  const [cmid] = useState(getCmidFromUrl);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const rawSearch = window.location.search;
    const normalizedSearch = rawSearch.replace(/&amp;/g, "&");
    const params = new URLSearchParams(normalizedSearch);

    if (chatSuggestInitKeys.has(normalizedSearch)) {
      console.log('Skipping duplicate Chatbot init for search:', normalizedSearch);
      return;
    }
    chatSuggestInitKeys.add(normalizedSearch);

    const storageToken = sessionStorage.getItem('chatbot_token');
    const urlToken = params.get('wstoken') || params.get('amp;wstoken');
    const wstoken = storageToken || urlToken;
    if (!storageToken && urlToken) {
      sessionStorage.setItem('chatbot_token', urlToken);
    }

    const wsfunction = params.get('wsfunction') || params.get('amp;wsfunction');
    const moodlewsrestformat = params.get('moodlewsrestformat') || params.get('amp;moodlewsrestformat');
    const courseid = params.get('courseids[0]') || params.get('amp;courseids[0]') || params.get('courseids[]') || params.get('courseids');
    const assignmentid = params.get('assignmentid') || params.get('amp;assignmentid');
    const parsedCmid = params.get('cmid') || params.get('amp;cmid');

    console.log('Assignment ID:', assignmentid);
    console.log('Course Module ID:', parsedCmid);
    console.log('Course ID:', courseid);
    console.log('Token:', wstoken);
    console.log('URL Token:', urlToken);

    if (!wstoken || !courseid) {
      console.warn('Moodle params missing in Chatbot, skip REST call', {
        wstoken,
        courseid,
      });
      return;
    }

    moodleApi.getUserInfo()
      .then((data) => {
        console.log('User info response:', data);
        const resolvedUserId = data.userid;
        if (resolvedUserId) {
          setUserId(resolvedUserId);
          console.log('userId:', resolvedUserId);
        } else {
          console.warn('Could not resolve userId from getUserInfo response', data);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch user info:', error);
      });

    const moodleParams = {
      wstoken,
      wsfunction,
      moodlewsrestformat,
      'courseids[0]': courseid,
    };

    const chatSuggestParams = {
      'courseids[0]': courseid,
      ...(assignmentid ? { assignmentid } : {}),
      ...(parsedCmid ? { cmid: parsedCmid } : {}),
    };
    
    // Fetch từ Moodle API
    moodleApi.getCourseAssignments(moodleParams)
      .then((data) => {
        const course = data?.courses?.[0];
        // Lọc assignment theo assignmentid nếu có, nếu không thì lấy assignment đầu tiên
        const assignment = assignmentid && course?.assignments 
          ? course.assignments.find(a => a.id === parseInt(assignmentid))
          : course?.assignments?.[0];
        if (course && assignment) {
          setMoodleInfo({
            fullname: course.fullname,
            assignmentName: assignment.name,
            intro: assignment.intro,
          });
        } else if (!assignment) {
          console.warn('Assignment not found with ID:', assignmentid);
        }
      })
      .catch((error) => {
        console.error('Moodle REST request failed:', error);
      });

    // Fetch từ Chat Suggest API
    chatbotApi.getChatSuggestions(chatSuggestParams)
      .then((data) => {
        setSuggestInfo(data);
      })
      .catch((error) => {
        console.error('Chat suggest request failed:', error);
      });
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 text-[14px] leading-6 text-slate-800">
      <div className={`h-screen relative overflow-hidden bg-slate-50 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-[40%] min-w-[20rem] border-r border-slate-200' : 'w-0 min-w-0'}`}>
        {sidebarOpen && (
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm hover:bg-slate-100"
            >
              ⬌
            </button>
          </div>
        )}
        <div className={`h-full overflow-y-auto ${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          <SideBar info={moodleInfo} suggest={suggestInfo} />
        </div>
      </div>
      <div className="relative h-screen flex-1 overflow-hidden">
        {!sidebarOpen && (
          <div className="absolute left-4 top-4 z-20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm hover:bg-slate-100"
            >
              ⬌
            </button>
          </div>
        )}
        <ChatContent userId={userId} cmid={cmid} nextQuestions={suggestInfo?.nextQuestions || []} />
      </div>
    </div>
  );
}

export default Chatbot;
