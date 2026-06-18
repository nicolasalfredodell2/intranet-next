import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "animate.css";
import "@mdi/font/css/materialdesignicons.min.css";
import "primeicons/primeicons.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/arya-blue/theme.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-montserrat",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Intranet",
  description: "Intranet",
  authors: [{ name: "Tribunal de Cuentas de Río Negro - Area Informática" }],
  robots: "noindex",
  themeColor: "#1976d2",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${montserrat.variable} ${inter.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />

        {/* Local CSS */}
        <link rel="stylesheet" href="/assets/plugins/Magnific-Popup-master/dist/magnific-popup.css" />
        <link rel="stylesheet" href="/assets/css/pages/login-register-lock.css" />
        <link rel="stylesheet" href="/assets/css/pages/other-pages.css" />
        <link rel="stylesheet" href="/assets/css/pages/ribbon-page.css" />
        <link rel="stylesheet" href="/assets/css/pages/tab-page.css" />
        <link rel="stylesheet" href="/assets/css/pages/user-card.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
        <link rel="stylesheet" href="/assets/css/colors/default-dark.css" />
      </head>
      <body className={`fix-header card-no-border fix-sidebar ${montserrat.className}`}>
        {children}

        {/* jQuery (must load first, before plugins) */}
        <Script src="/assets/plugins/jquery/jquery.min.js" strategy="beforeInteractive" />
        <Script src="/assets/plugins/bootstrap/js/popper.min.js" strategy="beforeInteractive" />
        <Script src="/assets/plugins/bootstrap/js/bootstrap.min.js" strategy="beforeInteractive" />

        {/* jQuery plugins */}
        <Script src="/assets/js/perfect-scrollbar.jquery.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/waves.js" strategy="afterInteractive" />
        <Script src="/assets/js/sidebarmenu.js" strategy="afterInteractive" />
        <Script src="/assets/plugins/sticky-kit-master/dist/sticky-kit.min.js" strategy="afterInteractive" />
        <Script src="/assets/plugins/sparkline/jquery.sparkline.min.js" strategy="afterInteractive" />
        <Script src="/assets/plugins/Magnific-Popup-master/dist/jquery.magnific-popup.min.js" strategy="afterInteractive" />
        <Script src="/assets/plugins/Magnific-Popup-master/dist/jquery.magnific-popup-init.js" strategy="afterInteractive" />
        <Script src="/assets/plugins/peity/jquery.peity.min.js" strategy="afterInteractive" />
        <Script src="/assets/plugins/peity/jquery.peity.init.js" strategy="afterInteractive" />
        <Script src="/assets/js/custom.js" strategy="afterInteractive" />
        <Script src="/assets/plugins/styleswitcher/jQuery.style.switcher.js" strategy="afterInteractive" />

        {/* TinyMCE */}
        <Script src="/assets/plugins/tinymce/tinymce.min.js" strategy="afterInteractive" />
        <Script id="tinymce-init" strategy="afterInteractive">{`
          function initEditorTinymce() {
            if (tinymce.get('mymce')) {
              tinymce.execCommand('mceRemoveEditor', true, 'mymce');
            }
            tinymce.init({
              selector: "textarea#mymce",
              language: 'es',
              theme: 'modern',
              height: 300,
              browser_spellcheck: true,
              elementpath: false,
              spellchecker_language: 'es',
              font_formats: "Arial=arial,helvetica,sans-serif; Arial Black=arial black,avant garde; Montserrat=montserrat;",
              content_style: 'body { font-family: Montserrat !important }',
              content_css: ['https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap'],
              plugins: [
                "advlist autolink link image lists charmap print preview hr anchor pagebreak spellchecker",
                "searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking",
                "save table contextmenu directionality emoticons template paste textcolor"
              ],
              toolbar: "insertfile undo redo | styleselect | fontselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | print preview media fullpage | forecolor backcolor",
              file_picker_types: 'image',
              file_picker_callback: function(callback, value, meta) {
                openCustomFileChooser(callback);
              },
            });
          }
          function openCustomFileChooser(callback) {
            var input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.onchange = function() {
              var file = this.files[0];
              var reader = new FileReader();
              reader.onload = function() { callback(reader.result); };
              reader.readAsDataURL(file);
            };
            input.click();
          }
        `}</Script>

        {/* Google reCAPTCHA */}
        <Script
          src="https://www.google.com/recaptcha/api.js?render=explicit&onload=initRecaptcha"
          strategy="afterInteractive"
        />

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KWH6R9JKW0"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){ dataLayer.push(arguments); }
          gtag('js', new Date());
          gtag('config', 'G-KWH6R9JKW0');
        `}</Script>
      </body>
    </html>
  );
}
