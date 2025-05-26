import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from "../views/LoginPage.vue"
import SignupPage from "../views/SignupPage.vue"
import ForgotPassPage from "../views/ForgotPassPage.vue"
import HomePage from "../views/HomePage.vue"
import MenuButton from '../components/MenuButton.vue'
import Profile from '../views/Profile.vue'
import Hotels from '../views/Hotels.vue'
import Dashboard from '../views/Dashboard.vue'
import RatingDetails from '../views/RatingDetails.vue'
import HotelDetails from '../views/HotelDetails.vue'
import Reserve from '../views/Reserve.vue'
import BookingProcess from '../views/BookingProcess.vue'
import BookingHistory from '../views/BookingHistory.vue'
import TransactionHistory from '../views/TransactionHistory.vue'

const routes = [
  { path: '/login', name: 'Login', component: LoginPage },
  { path: '/signup',name: 'Signup', component: SignupPage },
  { path: '/forgotpass',name: 'Forgotpass', component: ForgotPassPage },
  { path: '/Homepage',name: 'Homepage', component: HomePage,     meta: {navbarBehavior: 'homepage'}},
  {path: '/Menu', name: "Menu", component: MenuButton},
  {path:'/profile', name: "Profile", component:Profile, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  {path:'/hotels', name: "Hotels", component:Hotels, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  {path:'/dashboard', name: "AdminDashBoard", component:Dashboard, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  {path:'/hotels/ratings', name: "RatingDetails", component:RatingDetails, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  {path: '/reserve', name: 'Reserve', component: Reserve, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  {path: '/BookingProcess', name: 'BookingProcess', component: BookingProcess, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  {path: '/BookingHistory', name: 'BookingHistory', component: BookingHistory, meta: {navbarBehavior: 'stickyWithHideOnScroll'}}, 
  {path: '/TransactionHistory', name: 'TransactionHistory', component: TransactionHistory, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  {path: '/hotels/:id', name: 'HotelDetails', component: HotelDetails, meta: {navbarBehavior: 'stickyWithHideOnScroll'}, props: true},
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})
