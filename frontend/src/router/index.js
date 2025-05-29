import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from "../views/LoginPage.vue"
import SignupPage from "../views/SignupPage.vue"
import ForgotPassPage from "../views/ForgotPassPage.vue"
import HomePage from "../views/HomePage.vue"
import MenuButton from '../components/MenuButton.vue'
import Profile from '../views/Profile.vue'
import Ratings from '../views/Ratings.vue'
import Dashboard from '../views/Dashboard.vue'
import RatingDetails from '../views/RatingDetails.vue'
import Reserve from '../views/Reserve.vue'
import BookingProcess from '../views/BookingProcess.vue'
import vueCard1 from '../components/vueCard1.vue'
import vueCard from '../components/vueCard.vue'
import BookingHistory from '../views/BookingHistory.vue'


const routes = [
  { path: '/login', name: 'Login', component: LoginPage },
  { path: '/signup',name: 'Signup', component: SignupPage },
  { path: '/forgotpass',name: 'Forgotpass', component: ForgotPassPage },
  { path: '/Homepage',name: 'Homepage', component: HomePage,     meta: {navbarBehavior: 'homepage'}},
  {path: '/Menu', name: "Menu", component: MenuButton},
  {path:'/profile', name: "Profile", component:Profile, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  {path:'/ratings', name: "Ratings", component:Ratings, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  {path:'/admin', name: "AdminDashBoard", component:Dashboard, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  {path:'/ratingdetails', name: "RatingDetails", component:RatingDetails, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  {path: '/reserve', name: 'Reserve', component: Reserve, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  {path: '/BookingProcess', name: 'BookingProcess', component: BookingProcess, meta: {navbarBehavior: 'stickyWithHideOnScroll'}}, 
  {path: '/BookingHistory', name: 'BookingHistory', component: BookingHistory, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  {path: '/vueCard', name: 'vueCard', component: vueCard},

]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})
