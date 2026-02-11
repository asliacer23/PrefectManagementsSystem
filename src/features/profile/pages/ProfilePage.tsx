import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import { EditProfileForm } from "../components";

export function ProfilePage() {
  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="My Profile"
          description="Manage your profile information and preferences"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            <EditProfileForm />
          </div>

          {/* Sidebar with additional info */}
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
                Profile Info
              </h3>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-2">
                <li>• Keep your name accurate and up-to-date</li>
                <li>• Add department and section details</li>
                <li>• Your email cannot be changed</li>
                <li>• Changes are saved immediately</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
