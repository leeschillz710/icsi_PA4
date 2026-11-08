import { useEffect, useState } from "react";

const API_URL = "http://localhost:9000";

function ProjectMembers({ project, users, onMembersChanged }) {
    // store the membership documents for the selected project
    const [memberships, setMemberships] = useState([]);
    // store the ID selected in teh Add Member dropdown
    const [selectedUserId, setSelectedUserId] =
        useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // optional chaining produces undefined when no project
    // has been selected yet
    const projectId = project?._id;

    // retrieve memberships whenever the selected project changes
    useEffect(() => {
        if (!projectId) {
            setMemberships([]);
            return;
        }

        let ignore = false;

        async function getMembers() {
            try {
                setLoading(true);
                setMessage("");

                const response = await fetch(
                    `${API_URL}/api/projects/${projectId}/members`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message);
                }

                if (!ignore) {
                    setMemberships(data);
                }
            } catch (error) {
                if (!ignore) {
                    setMessage(
                        error.message ||
                        "Could not retrieve members."
                    );
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        // clear the old dropdown selection
        setSelectedUserId("");
        getMembers();

        return () => {
            ignore = true;
        };
    }, [projectId]);

    // reload memberships after an add or removal
    async function refreshMembers() {
        const response = await fetch(
            `${API_URL}/api/projects/${projectId}/members`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        setMemberships(data);
    }

    async function addMember(event) {
        event.preventDefault();
        setMessage("");

        if (!selectedUserId) {
            setMessage("Select a user to add.");
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/projects/${projectId}/members`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        user_id: selectedUserId
                    })
                }
            );

            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                setSelectedUserId("");
                await refreshMembers();
                onMembersChanged?.();
            }
        } catch (error) {
            console.error("Add member request failed:", error);
            setMessage("Could not connect to the server.");
        }
    }

    async function removeMember(userId) {
        setMessage("");

        try {
            const response = await fetch(
                `${API_URL}/api/projects/${projectId}/members/${userId}`,
                {
                    method: "DELETE"
                }
            );

            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                await refreshMembers();
                onMembersChanged?.();
            }
        } catch (error) {
            console.error(
                "Remove member request failed:",
                error
            );
            setMessage("Could not connect to the server.");
        }
    }

    // translate a memberships user_id into a readable user
    function findUser(userId) {
        return users.find(
            (user) =>
                String(user._id) === String(userId)
        );
    }

    // determine whether a member is the protected lead
    function isProjectLead(userId) {
        return (
            String(project.project_lead_id) ===
            String(userId)
        );
    }

    // show instruction until a project is selected
    if (!project) {
        return (
            <section>
                <h2>Project Members</h2>
                <p>Select a project to view its members.</p>
            </section>
        );
    }

    return (
        <section>
            <h2>{project.name} Members</h2>

            <form onSubmit={addMember}>
                <label htmlFor="new-member">
                    Add a registered user
                </label>

                <select
                    id="new-member"
                    value={selectedUserId}
                    onChange={(event) =>
                        setSelectedUserId(event.target.value)
                    }
                    required
                >
                    <option value="">
                        Select a user
                    </option>

                    {users.map((user) => (
                        <option
                            key={user._id}
                            value={user._id}
                        >
                            {user.f_name} {user.l_name}
                            {" "}({user.username})
                        </option>
                    ))}
                </select>

                <button type="submit">
                    Add Member
                </button>
            </form>

            {loading ? (
                <p>Loading members...</p>
            ) : (
                <ul>
                    {memberships.map((membership) => {
                        const user = findUser(
                            membership.user_id
                        );

                        return (
                            <li key={membership._id}>
                                <span>
                                    {user
                                        ? `${user.f_name} ${user.l_name} (${user.username})`
                                        : "Unknown user"}

                                    {isProjectLead(
                                        membership.user_id
                                    )
                                        ? " — Project Lead"
                                        : ""}
                                </span>

                                {!isProjectLead(
                                    membership.user_id
                                ) && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeMember(
                                                membership.user_id
                                            )
                                        }
                                    >
                                        Remove
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {message && <p>{message}</p>}
        </section>
    );
}

export default ProjectMembers;