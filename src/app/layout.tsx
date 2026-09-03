import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'الرحلة | عروض سفر عربية',
  description:
    'الرحلة منصة عربية مبسطة لمقارنة عروض التذاكر والتأشيرات وطلب عروض خاصة من وكلاء موثوقين.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
