import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types";
import { useUser } from "@clerk/clerk-react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase.config";

interface UserContextType {
  dbUser: User | null;
  isLoadingDbUser: boolean;
}

const UserContext = createContext<UserContextType>({
  dbUser: null,
  isLoadingDbUser: true,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isLoadingDbUser, setIsLoadingDbUser] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchDbUser = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          const userSnap = await getDoc(doc(db, "users", user.id));
          if (userSnap.exists()) {
            if (isMounted) setDbUser(userSnap.data() as User);
          } else {
            const userData: User = {
              id: user.id,
              name: user.fullName || user.firstName || "Anonymous",
              email: user.primaryEmailAddress?.emailAddress || "N/A",
              imageUrl: user.imageUrl,
              role: "user",
              createdAt: serverTimestamp(),
              updateAt: serverTimestamp(),
            };

            await setDoc(doc(db, "users", user.id), userData);
            if (isMounted) setDbUser(userData);
          }
        } catch (error) {
          console.error("Error fetching db user: ", error);
        } finally {
          if (isMounted) setIsLoadingDbUser(false);
        }
      } else if (isLoaded && !isSignedIn) {
        if (isMounted) {
          setDbUser(null);
          setIsLoadingDbUser(false);
        }
      }
    };

    fetchDbUser();

    return () => {
      isMounted = false;
    };
  }, [user, isLoaded, isSignedIn]);

  return (
    <UserContext.Provider value={{ dbUser, isLoadingDbUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useDbUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useDbUser must be used within a UserProvider");
  }
  return context;
};
