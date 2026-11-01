let notes = [];
export const fetchNotes = async () => notes;
export const createNote = async (title, content) => { notes = [{ id: String(Date.now()), title, content }, ...notes]; };
export const deleteNote = async (id) => { notes = notes.filter((n) => n.id !== id); };
export const subscribeToAuth = () => () => {};
export const getUserProfile = async () => ({ displayName: 'Alex Rivera', role: 'student' });
export const logoutUser = async () => {};
export const isPrimaryProfile = () => false;
