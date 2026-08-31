import { redirect } from 'next/navigation';

// ADMIN ROLE SYSTEM HIDDEN - This portal is disabled
export default function AdminLoginPage() {
  redirect('/login');
}
