import { Container } from "@/components/container";
import { Footer } from "@/components/footer";

import Header from "@/components/header";
import { Outlet } from "react-router-dom";
import { useState } from "react";

export const MainLayout = () => {
  const [showFooter, setShowFooter] = useState(true);
  const [showHeader, setShowHeader] = useState(true);

  return (
    <div className="flex flex-col h-screen">
      {showHeader && <Header />}

      <Container className="flex-grow">
        <main className="flex-grow">
          <Outlet context={{ showFooter, setShowFooter, showHeader, setShowHeader }} />
        </main>
      </Container>

      {showFooter && <Footer />}
    </div>
  );
};
