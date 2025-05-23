import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from "../views/LoginPage.vue"
import SignupPage from "../views/SignupPage.vue"
import ForgotPassPage from "../views/ForgotPassPage.vue"
import HomePage from "../views/HomePage.vue"
import MenuButton from '../components/MenuButton.vue'
import Profile from '../views/Profile.vue'
import Ratings from '../views/Ratings.vue'
// import Dashboard from '../views/Dashboard.vue'
import RatingDetails from '../views/RatingDetails.vue'
import Reserve from '../views/Reserve.vue'
import BookingProcess from '../views/BookingProcess.vue'


const routes = [
  { path: '/login', name: 'Login', component: LoginPage },
  { path: '/signup',name: 'Signup', component: SignupPage },
  { path: '/forgotpass',name: 'Forgotpass', component: ForgotPassPage },
  { path: '/Homepage',name: 'Homepage', component: HomePage },
  {path: '/Menu', name: "Menu", component: MenuButton},
  {path:'/profile', name: "Profile", component:Profile},
  {path:'/ratings', name: "Ratings", component:Ratings},
  // {path:'/admin', name: "AdminDashBoard", component:Dashboard},
  {path:'/ratingdetails', name: "RatingDetails", component:RatingDetails},
  {path: '/reserve', name: 'Reserve', component: Reserve},
  {path: '/BookingProcess', name: 'BookingProcess', component: BookingProcess}, 
]

export default createRouter({
  history: createWebHistory(),
  routes
})
