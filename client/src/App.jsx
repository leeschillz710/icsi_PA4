import { useEffect, useState } from "react";

import Signup from "./components/Signup";
import Login from "./components/Login";
import CreateProject from "./components/CreateProject";
import ProjectList from "./components/ProjectList";
import ProjectMembers from "./components/ProjectMembers";
import ProjectBacklog from "./components/ProjectBacklog";

// ALL frontend requests are sent to the Express server
const API_URL = "http://localhost:9000";

function App() {
    // store all projects returned by GET /api/users
    const [users, setUsers] = useState([]);
    // store all projects returned by GET /api/projects
    const [projects, setProjects] = useState([]);
    // store the ID of the project whose members are visible
    const [selectedProjectId, setSelectedProjectId] =
        useState("");
    // store errors related to loading shared application data
    const [dataError, setDataError] = useState("");
    // Reload backlog membership choices after members change.
    const [membershipVersion, setMembershipVersion] = useState(0);

    function handleMembersChanged() {
        setMembershipVersion((version) => version + 1);
}

    // load users and projects when App first appears.
    useEffect(() => {
        // this flag prevents an outdated request from changing
        // state after the component is removed
        let ignore = false;

        async function loadInitialData() {
            try {
                // request users and projects at the same time
                const [usersResponse, projectsResponse] =
                    await Promise.all([
                        fetch(`${API_URL}/api/users`),
                        fetch(`${API_URL}/api/projects`)
                    ]);

                const usersData =
                    await usersResponse.json();
                const projectsData =
                    await projectsResponse.json();
                // fetch() does not automatically throw when the
                // server returns statuses such as 400 or 500
                if (!usersResponse.ok) {
                    throw new Error(
                        usersData.message ||
                        "Could not retrieve users."
                    );
                }

                if (!projectsResponse.ok) {
                    throw new Error(
                        projectsData.message ||
                        "Could not retrieve projects."
                    );
                }

                if (!ignore) {
                    setUsers(usersData);
                    setProjects(projectsData);
                }
            } catch (error) {
                if (!ignore) {
                    setDataError(error.message);
                }
            }
        }

        loadInitialData();

        // react calls this cleanup before the effect is removed
        return () => {
            ignore = true;
        };
    }, []);
    // reload the users after a successful signup. Without this,
    // the new account would not immediately appear in the lead
    // and member dropdowns
    async function refreshUsers() {
        try {
            const response = await fetch(
                `${API_URL}/api/users`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Could not retrieve users."
                );
            }

            setUsers(data);
            setDataError("");
        } catch (error) {
            setDataError(error.message);
        }
    }

    // reload projects after a new project is created
    async function refreshProjects() {
        const response = await fetch(
            `${API_URL}/api/projects`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Could not retrieve projects."
            );
        }

        setProjects(data);
    }

    // this function is passed to CreateProject as a prop
    async function handleProjectCreated(projectId) {
        try {
            // reload the project list from MongoDB
            await refreshProjects();
            // automatically select the newly created project
            setSelectedProjectId(projectId);
            setDataError("");
        } catch (error) {
            setDataError(error.message);
        }
    }
    
    // convert both IDs to strings before comparing them because
    // MongoDB IDs arrive through JSON as strings
    const selectedProject = projects.find(
        (project) =>
            String(project._id) ===
            String(selectedProjectId)
    );

    return (
        <main>
            <h1>Project Management</h1>

            <section>
                <Signup onSignupSuccess={refreshUsers} />
                <Login />
            </section>

            {dataError && <p>{dataError}</p>}

            <CreateProject
                users={users}
                onProjectCreated={handleProjectCreated}
            />

            <ProjectList
                projects={projects}
                users={users}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
            />
            
            <ProjectMembers
                key={selectedProjectId || "members"}
                project={selectedProject}
                users={users}
                onMembersChanged={handleMembersChanged}
            />

            <ProjectBacklog
                key={selectedProjectId || "backlog"}
                project={selectedProject}
                users={users}
                membershipVersion={membershipVersion}
            />
        </main>
    );
}

export default App;