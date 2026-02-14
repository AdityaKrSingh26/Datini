import TopBar from './TopBar';
import BottomNav from './BottomNav';

const PageLayout = ({ children, title, pendingCount, stockAlertCount, notificationCount }) => {
  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-20 md:pb-0 relative z-10">
      <TopBar title={title} notificationCount={notificationCount} />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>
      <BottomNav pendingCount={pendingCount} stockAlertCount={stockAlertCount} />
    </div>
  );
};

export default PageLayout;
