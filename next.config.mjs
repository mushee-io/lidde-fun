/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode:true,
  async headers(){return [{
    source:"/:path*",
    headers:[
      {key:"X-Content-Type-Options",value:"nosniff"},
      {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
      {key:"X-Frame-Options",value:"DENY"},
      {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=(), payment=()"},
      {key:"Content-Security-Policy",value:"frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'"},
      {key:"X-Robots-Tag",value:"noindex, nofollow"}
    ]
  }];}
};
export default nextConfig;
