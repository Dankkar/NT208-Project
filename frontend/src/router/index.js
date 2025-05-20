import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from "../views/LoginPage.vue"
import SignupPage from "../views/SignupPage.vue"
import ForgotPassPage from "../views/ForgotPassPage.vue"
import HomePage from "../views/HomePage.vue"
import MenuButton from '../components/MenuButton.vue'
import UserInfo from '../views/UserInfo.vue'

const routes = [
  { path: '/login', name: 'Login', component: LoginPage },
  { path: '/signup',name: 'Signup', component: SignupPage },
  { path: '/forgotpass',name: 'Forgotpass', component: ForgotPassPage },
  { path: '/Homepage',name: 'Homepage', component: HomePage },
  {path: '/Menu', name: "Menu", component: MenuButton},
  {path:'/UserInfo', name: "UserInfo", component: UserInfo},
]

export default createRouter({
  history: createWebHistory(),
  routes
})
