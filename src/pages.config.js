import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import ProjectDetail from './pages/ProjectDetail';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import Layout from './Layout.jsx';


export const PAGES = {
    "Chat": Chat,
    "Dashboard": Dashboard,
    "Projects": Projects,
    "Settings": Settings,
    "ProjectDetail": ProjectDetail,
    "Documents": Documents,
    "Reports": Reports,
    "Terms": Terms,
    "Contact": Contact,
}

export const pagesConfig = {
    mainPage: "Chat",
    Pages: PAGES,
    Layout: Layout,
};