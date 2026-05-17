// Mock Firebase for Hackathon MVP frontend
export const auth = {
  currentUser: null
};

export const signInWithEmailAndPassword = async (auth, email, password) => {
  if (email && password) {
    auth.currentUser = { email, uid: "mock_user", getIdToken: async () => "mock_token_for_testing" };
    return { user: auth.currentUser };
  }
  throw new Error("Invalid credentials");
};

export const onAuthStateChanged = (auth, callback) => {
  callback(auth.currentUser);
  return () => {}; // unsubscribe function
};
