import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar";
import Navbar from "../../components/navbar/navbar";
import { motion, AnimatePresence } from "framer-motion";
import { User, X, LogOut, ChevronRight, Users } from "lucide-react";
import SelectUser from "../../components/selectUser/selectUser";
import { AuthService } from "@/services/auth";
import AmbientBackground from "@/components/layout/AmbientBackground";
import { PageHeaderSlotProvider } from "@/components/layout/PageHeader";

export default function Panel() {
  const [showMenu, setShowMenu] = useState(false);
  const [openSelectUser, setOpenSelectUser] = useState(false);
  const [headerSlot, setHeaderSlot] = useState<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // Check if onboarding is completed
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (!user.onboardingCompleted) {
        navigate("/onboarding");
      }
    }
  }, [navigate]);

  return (
    <div className="relative isolate flex h-screen w-full font-custom">
      <AmbientBackground />
      {openSelectUser && (
        <SelectUser
          onClose={() => {
            setOpenSelectUser(false);
            window.location.reload();
          }}
        />
      )}
      <Sidebar />
      {/* El sidebar flota a 16px del borde: el contenido arranca tras sus 240px más otros 16. */}
      <div className="flex h-full w-full flex-col overflow-y-auto lg:pl-[272px]">
        <Navbar onSwitchUser={() => setOpenSelectUser(true)} headerSlotRef={setHeaderSlot} />
        <PageHeaderSlotProvider value={headerSlot}>
          <main className="flex-1">
            <Outlet />
          </main>
        </PageHeaderSlotProvider>
        <footer className="px-4 pb-6 pt-8 text-center text-xs text-white/50 lg:pl-4 lg:pr-8">
          Desarrollado por{" "}
          <a
            href="https://jpdev.com.co"
            target="_blank"
            rel="noopener"
            className="text-white/70 underline underline-offset-2 transition-colors hover:text-white"
          >
            JP Development
          </a>
        </footer>
      </div>

      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1 },
                exit: { opacity: 0 },
              }}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              variants={{
                hidden: { x: "100%", opacity: 0 },
                visible: { x: 0, opacity: 1 },
                exit: { x: "100%", opacity: 0 },
              }}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="fixed right-0 top-0 z-50 h-full w-80 bg-white shadow-2xl dark:bg-gray-800"
            >
              <div className="flex h-full flex-col p-6">
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-2xl font-bold text-transparent">
                    Menu
                  </h2>
                  <motion.button
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowMenu(false)}
                    className="rounded-full p-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </motion.button>
                </div>

                <div className="flex-grow space-y-4">
                  <motion.button
                    whileHover={{ x: 10, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/panel/profile");
                    }}
                    className="group flex w-full items-center gap-4 rounded-xl p-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="rounded-lg bg-purple-100 p-2 transition-colors duration-200 group-hover:bg-purple-200 dark:bg-purple-900/30 dark:group-hover:bg-purple-900/50">
                      <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">Perfil</span>
                    <ChevronRight className="ml-auto h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:translate-x-1" />
                  </motion.button>

                  <motion.button
                    whileHover={{ x: 10, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowMenu(false);
                      setOpenSelectUser(true);
                    }}
                    className="group flex w-full items-center gap-4 rounded-xl p-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="rounded-lg bg-blue-100 p-2 transition-colors duration-200 group-hover:bg-blue-200 dark:bg-blue-900/30 dark:group-hover:bg-blue-900/50">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      Cambiar Usuario
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:translate-x-1" />
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    await AuthService.logout();
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 p-4 text-white shadow-lg transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:shadow-red-500/20"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Cerrar Sesión</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
