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
import CompleteProfilePage from '../views/CompleteProfilePage.vue'
import FindRoomTypePage   from '../views/admin/branches/FindRoomTypePage.vue'
import AddRoomTypePage      from '../views/admin/branches/AddRoomTypePage.vue'
import EditRoomTypePage from '../views/admin/branches/EditRoomTypePage.vue'
// import AddAmenityPage    from '../views/admin/branches/AddAmenityPage.vue'
// import RemoveAmenityPage from '../views/admin/branches/RemoveAmenityPage.vue'
// import UpdateInfoPage    from '../views/admin/branches/UpdateInfoPage.vue'
// import StatsPage      from '../views/admin/bookings/StatsPage.vue'
// import RemoveBookPage from '../views/admin/bookings/RemoveBookPage.vue'
import FindUserPage    from '../views/admin/users/FindUserPage.vue'
import EditUserPage from '../views/admin/users/EditUserPage.vue'


const routes = [
  { path: '/login', name: 'Login', component: LoginPage },
  { path: '/signup',name: 'Signup', component: SignupPage },
  { path: '/forgotpass',name: 'Forgotpass', component: ForgotPassPage },
  { path: '/Homepage',name: 'Homepage', component: HomePage,     meta: {navbarBehavior: 'homepage'}},
  { path: '/Menu', name: "Menu", component: MenuButton},
  { path: '/profile', name: "Profile", component:Profile, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  { path: '/hotels', name: "Hotels", component:Hotels, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  { path: '/hotels/ratings', name: "RatingDetails", component:RatingDetails, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  { path: '/reserve', name: 'Reserve', component: Reserve, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  { path: '/BookingProcess', name: 'BookingProcess', component: BookingProcess, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  { path: '/BookingHistory', name: 'BookingHistory', component: BookingHistory, meta: {navbarBehavior: 'stickyWithHideOnScroll'}}, 
  { path: '/TransactionHistory', name: 'TransactionHistory', component: TransactionHistory, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  { path: '/hotels/:id', name: 'HotelDetails', component: HotelDetails, meta: {navbarBehavior: 'stickyWithHideOnScroll'}, props: true},
  { path: '/complete-profile', name: 'CompleteProfilePage', component: CompleteProfilePage, meta: { requiresAuth: true }},
  {
    path: '/admin',
    component: Dashboard,
    meta: { navbarBehavior: 'stickyWithHideOnScroll', requiresAuth: true, requiresAdmin: true },
    children: [
      // { path: '', redirect: 'dashboard' },

      // Dashboard chính
      // { path: 'reservations', name: 'Reservations', component: ReservationsPage },
      // { path: 'reviews',      name: 'Reviews',      component: ReviewsPage },

      // Branches
      { path: 'branches/find-room-type',       name: 'FindRoomType',       component: FindRoomTypePage },
      { path: 'branches/add-room-type',    name: 'AddRoomType',    component: AddRoomTypePage },
      { path: 'branches/edit-room-type/:roomTypeId',    name: 'EditRoomType',    component: EditRoomTypePage, props: true },
      // { path: 'branches/add-amenity',    name: 'AddAmenity',    component: AddAmenityPage },
      // { path: 'branches/remove-amenity', name: 'RemoveAmenity', component: RemoveAmenityPage },

      // Bookings
      // { path: 'bookings/statistics', name: 'BookingsStats', component: StatsPage },
      // { path: 'bookings/remove',     name: 'BookingsRemove', component: RemoveBookPage },

      // Users
      { path: 'users/find-user',    name: 'AdminFindUser',    component: FindUserPage },
      { path: 'users/edit-user/:userId',    name: 'AdminEditUser',    component: EditUserPage, props: true },
    ]
  },
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})


