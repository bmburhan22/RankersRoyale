
export const ROUTES ={
    HOME: '/',
    CASINOS_PAGE: '/casinos/:casino_id?',
    LOGIN: '/login',
    ADMIN_HOME: '/admin',
    
    ME: '/api/me',
    MEMBERS: '/api/members',
    CASINOS: '/api/casinos',
    RESET_LEADERBOARD: '/api/reset-leaderboard',
    REDEEM: '/api/redeem',
    BUY:'/api/buy',
    
    SETTINGS:'/api/settings',
    SHOP:'/api/shop',
}
export const DISCORD_API = 'https://discord.com/api';
export const CLIENT_ROUTES = [
    ROUTES.HOME,
    ROUTES.CASINOS_PAGE,
    ROUTES.ADMIN_HOME,
];