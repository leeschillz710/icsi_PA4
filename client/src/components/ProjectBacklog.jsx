import { useEffect, useState } from "react";

const API_URL = "http://localhost:9000";

function emptyForm() {
    return {
        title: "",
        description: "",
        priority: "Medium",
        status: "To Do",
        assigned_user_id: ""
    };
}

function ProjectBacklog({ project, users, membershipVersion }) {
    const [stories, setStories] = useState([]);
    const [memberships, setMemberships] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [loadError, setLoadError] = useState("");
    const [reloadVersion, setReloadVersion] = useState(0);

    const projectId = project?._id;

    // Load this project's stories and current memberships.
    useEffect(() => {
        if (!projectId) {
            return;
        }

        let ignore = false;

        async function loadBacklog() {
            setLoading(true);
            setLoadError("");

            try {
                const [storiesResponse, membersResponse] =
                    await Promise.all([
                        fetch(
                            `${API_URL}/api/projects/${projectId}/stories`
                        ),
                        fetch(
                            `${API_URL}/api/projects/${projectId}/members`
                        )
                    ]);

                const storiesData = await storiesResponse.json();
                const membersData = await membersResponse.json();

                if (!storiesResponse.ok) {
                    throw new Error(
                        storiesData.message ||
                        "Could not retrieve stories."
                    );
                }

                if (!membersResponse.ok) {
                    throw new Error(
                        membersData.message ||
                        "Could not retrieve project members."
                    );
                }

                if (!ignore) {
                    setStories(storiesData);
                    setMemberships(membersData);
                }
            } catch (error) {
                if (!ignore) {
                    setLoadError(error.message);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        loadBacklog();

        // Ignore responses from an old project or old request.
        return () => {
            ignore = true;
        };
    }, [projectId, membershipVersion, reloadVersion]);

    // Only current project members appear in the dropdown.
    // PA3 automatically includes the Project Lead as a member.
    const projectMembers = users.filter((user) =>
        memberships.some(
            (membership) =>
                String(membership.user_id) === String(user._id)
        )
    );

    function memberName(userId) {
        if (!userId) {
            return "Unassigned";
        }

        const user = users.find(
            (item) => String(item._id) === String(userId)
        );

        if (!user) {
            return "Unknown user";
        }

        const fullName = [user.f_name, user.l_name]
            .filter(Boolean)
            .join(" ");

        return fullName
            ? `${fullName} (${user.username})`
            : user.username;
    }

    function changeField(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value
        }));
    }

    function resetForm() {
        setEditingId(null);
        setForm(emptyForm());
    }

    function editStory(story) {
        setEditingId(story._id);
        setForm({
            title: story.title,
            description: story.description,
            priority: story.priority,
            status: story.status,
            assigned_user_id: story.assigned_user_id || ""
        });
        setMessage("");
    }

    async function saveStory(event) {
        event.preventDefault();
        setMessage("");

        if (!form.title.trim() || !form.description.trim()) {
            setMessage("Title and description are required.");
            return;
        }

        setBusy(true);

        try {
            const url = editingId
                ? `${API_URL}/api/projects/${projectId}/stories/${editingId}`
                : `${API_URL}/api/projects/${projectId}/stories`;

            const payload = {
                title: form.title,
                description: form.description,
                priority: form.priority,
                assigned_user_id:
                    form.assigned_user_id || null
            };

            // Only editing sends a status.
            // The backend sets every new story to To Do.
            if (editingId) {
                payload.status = form.status;
            }

            const response = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not save the story."
                );
            }

            resetForm();
            setMessage(data.message);
            setReloadVersion((version) => version + 1);
        } catch (error) {
            setMessage(error.message);
        } finally {
            setBusy(false);
        }
    }

    async function deleteStory(story) {
        const confirmed = window.confirm(
            `Delete "${story.title}"? This cannot be undone.`
        );

        // Cancel sends no request and leaves MongoDB unchanged.
        if (!confirmed) {
            return;
        }

        setBusy(true);
        setMessage("");

        try {
            const response = await fetch(
                `${API_URL}/api/projects/${projectId}/stories/${story._id}`,
                { method: "DELETE" }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Could not delete the story."
                );
            }

            if (editingId === story._id) {
                resetForm();
            }

            setMessage(data.message);
            setReloadVersion((version) => version + 1);
        } catch (error) {
            setMessage(error.message);
        } finally {
            setBusy(false);
        }
    }

    if (!project) {
        return (
            <section>
                <h2>Project Backlog</h2>
                <p>Select a project to view its user stories.</p>
            </section>
        );
    }

    return (
        <section>
            <h2>{project.name} Backlog</h2>

            {loadError && (
                <div role="alert">
                    <p>{loadError}</p>
                    <button
                        type="button"
                        disabled={loading || busy}
                        onClick={() =>
                            setReloadVersion((version) => version + 1)
                        }
                    >
                        Retry
                    </button>
                </div>
            )}

            <h3>
                {editingId ? "Edit User Story" : "Create User Story"}
            </h3>

            <form onSubmit={saveStory}>
                <fieldset disabled={busy || loading || Boolean(loadError)}>
                    <legend>Story information</legend>

                    <div>
                        <label htmlFor="story-title">Title</label>
                        <input
                            id="story-title"
                            name="title"
                            value={form.title}
                            onChange={changeField}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="story-description">
                            Description
                        </label>
                        <textarea
                            id="story-description"
                            name="description"
                            value={form.description}
                            onChange={changeField}
                            placeholder="As a [type of user], I want [goal], so that [benefit]."
                            rows={4}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="story-priority">Priority</label>
                        <select
                            id="story-priority"
                            name="priority"
                            value={form.priority}
                            onChange={changeField}
                            required
                        >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="story-assignment">
                            Assigned Member
                        </label>
                        <select
                            id="story-assignment"
                            name="assigned_user_id"
                            value={form.assigned_user_id}
                            onChange={changeField}
                        >
                            <option value="">Unassigned</option>

                            {projectMembers.map((user) => (
                                <option
                                    key={user._id}
                                    value={user._id}
                                >
                                    {memberName(user._id)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {editingId ? (
                        <div>
                            <label htmlFor="story-status">Status</label>
                            <select
                                id="story-status"
                                name="status"
                                value={form.status}
                                onChange={changeField}
                                required
                            >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">
                                    In Progress
                                </option>
                                <option value="Done">Done</option>
                            </select>
                        </div>
                    ) : (
                        <p>New story status: To Do</p>
                    )}

                    <button type="submit">
                        {busy
                            ? "Saving..."
                            : editingId
                                ? "Save Changes"
                                : "Create Story"}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            resetForm();
                            setMessage("");
                        }}
                    >
                        {editingId ? "Cancel" : "Clear"}
                    </button>
                </fieldset>
            </form>

            {message && <p role="status">{message}</p>}

            <h3>User Stories</h3>

            {loading ? (
                <p>Loading backlog...</p>
            ) : loadError ? (
                <p>The backlog could not be loaded.</p>
            ) : stories.length === 0 ? (
                <p>
                    This project has no stories yet.
                    Use the form above to create one.
                </p>
            ) : (
                <ul>
                    {stories.map((story) => (
                        <li key={story._id}>
                            <h4>{story.title}</h4>
                            <p>Priority: {story.priority}</p>
                            <p>Status: {story.status}</p>
                            <p>
                                Assigned Member:{" "}
                                {memberName(story.assigned_user_id)}
                            </p>

                            <details>
                                <summary>Description</summary>
                                <p style={{ whiteSpace: "pre-wrap" }}>
                                    {story.description}
                                </p>
                            </details>

                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => editStory(story)}
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => deleteStory(story)}
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export default ProjectBacklog;