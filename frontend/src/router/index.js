import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from "../views/LoginPage.vue"
import SignupPage from "../views/SignupPage.vue"
import ForgotPassPage from "../views/ForgotPassPage.vue"
import ResetPasswordPage from "../views/ResetPasswordPage.vue"
import HomePage from "../views/HomePage.vue"
import MenuButton from '../components/MenuButton.vue'
import Profile from '../views/Profile.vue'
import Hotels from '../views/Hotels.vue'
import Dashboard from '../views/Dashboard.vue'
import RatingDetails from '../views/RatingDetails.vue'
import HotelDetails from '../views/HotelDetails.vue'
import Reserve from '../views/Reserve.vue'
import BookingProcess from '../views/BookingProcess.vue'
// import vueCard1 from '../components/vueCard1.vue'
// import vueCard from '../components/vueCard.vue'
import BookingHistory from '../views/BookingHistory.vue'
import TransactionHistory from '../views/TransactionHistory.vue'
import CompleteProfilePage from '../views/CompleteProfilePage.vue'
import FindHotelPage from '../views/admin/branches/FindHotelPage.vue'
import AddHotelPage    from '../views/admin/branches/AddHotelPage.vue'
import EditHotelPage from '../views/admin/branches/EditHotelPage.vue'
import FindRoomTypePage   from '../views/admin/branches/FindRoomTypePage.vue'
import AddRoomTypePage      from '../views/admin/branches/AddRoomTypePage.vue'
import EditRoomTypePage from '../views/admin/branches/EditRoomTypePage.vue'
import FindAmenityPage from '../views/admin/branches/FindAmenityPage.vue'
import AddAmenityPage    from '../views/admin/branches/AddAmenityPage.vue'
import EditAmenityPage from '../views/admin/branches/EditAmenityPage.vue'
import FindRoomPage from '../views/admin/branches/FindRoomPage.vue'
import AddRoomPage    from '../views/admin/branches/AddRoomPage.vue'
import EditRoomPage from '../views/admin/branches/EditRoomPage.vue'
import StatsPage      from '../views/admin/bookings/StatsPage.vue'
import CheckInOutPage from '../views/admin/bookings/AdminCheckInOutPage.vue'
// import RemoveBookPage from '../views/admin/bookings/RemoveBookPage.vue'
import FindUserPage    from '../views/admin/users/FindUserPage.vue'
import EditUserPage from '../views/admin/users/EditUserPage.vue'
import ManagePromotionsPage from '../views/admin/promotions/ManagePromotionsPage.vue'
import AddPromotionPage from '../views/admin/promotions/AddPromotionPage.vue'
import EditPromotionPage from '../views/admin/promotions/EditPromotionPage.vue'



const routes = [
  { path: '/', redirect: '/Homepage' },
  { path: '/login', name: 'Login', component: LoginPage },
  { path: '/signup',name: 'Signup', component: SignupPage },
  { path: '/forgotpass',name: 'Forgotpass', component: ForgotPassPage },
  { path: '/reset-password/:token', name: 'ResetPassword', component: ResetPasswordPage },
  { path: '/reset-password', name: 'ResetPasswordQuery', component: ResetPasswordPage },
  { path: '/Homepage',name: 'Homepage', component: HomePage,     meta: {navbarBehavior: 'homepage'}},
  { path: '/Menu', name: "Menu", component: MenuButton},
  { path: '/profile', name: "Profile", component:Profile, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  { path: '/hotels', name: "Hotels", component:Hotels, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  { path: '/hotels/ratings', name: "RatingDetails", component:RatingDetails, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  { path: '/reserve', name: 'Reserve', component: Reserve, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  { path: '/bookingprocess', name: 'BookingProcess', component: BookingProcess, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  { path: '/BookingProcess', redirect: '/bookingprocess' }, // Redirect for backward compatibility
  { path: '/BookingHistory', name: 'BookingHistory', component: BookingHistory, meta: {navbarBehavior: 'stickyWithHideOnScroll'}}, 
  { path: '/TransactionHistory', name: 'TransactionHistory', component: TransactionHistory, meta: {navbarBehavior: 'stickyWithHideOnScroll'}},
  { path: '/hotels/:id', name: 'HotelDetails', component: HotelDetails, meta: {navbarBehavior: 'stickyWithHideOnScroll'}, props: true},
  { path: '/complete-profile', name: 'CompleteProfilePage', component: CompleteProfilePage },
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
      {path: 'branches/find-hotel',       name: 'AdminFindHotel',       component: FindHotelPage },
      {path: 'branches/add-hotel',    name: 'AdminAddHotel',    component: AddHotelPage, props: true },
      { path: 'branches/edit-hotel/:hotelId',    name: 'AdminEditHotel',    component: EditHotelPage, props: true },
      { path: 'branches/find-room-type',       name: 'AdminFindRoomType',       component: FindRoomTypePage },
      { path: 'branches/add-room-type/:hotelId',    name: 'AdminAddRoomType',    component: AddRoomTypePage, props: true },
      { path: 'branches/edit-room-type/:roomTypeId',    name: 'AdminEditRoomType',    component: EditRoomTypePage, props: true },
      { path: 'branches/find-amenity',       name: 'AdminFindAmenity',       component: FindAmenityPage, props: true },
      { path: 'branches/add-amenity/:hotelId',    name: 'AdminAddAmenity',    component: AddAmenityPage, props: true },
      { path: 'branches/edit-amenity/:amenityId',    name: 'AdminEditAmenity',    component: EditAmenityPage, props: true },
      { path: 'branches/find-room',       name: 'AdminFindRoom',       component: FindRoomPage, props: true },
      { path: 'branches/add-room/:hotelId/:roomTypeId',    name: 'AdminAddRoom',    component: AddRoomPage, props: true },
      { path: 'branches/edit-room/:roomId',    name: 'AdminEditRoom',    component: EditRoomPage, props: true },

      // Bookings
      { path: 'bookings/statistics', name: 'BookingsStats', component: StatsPage },
      { path: 'bookings/check-in-out/', name: 'BookingsCheckInOut', component: CheckInOutPage, props: true },
      // { path: 'bookings/remove',     name: 'BookingsRemove', component: RemoveBookPage },

      // Users
      { path: 'users/find-user',    name: 'AdminFindUser',    component: FindUserPage },
      { path: 'users/edit-user/:userId',    name: 'AdminEditUser',    component: EditUserPage, props: true },

      // Promotions
      { path: 'promotions', name: 'AdminManagePromotions', component: ManagePromotionsPage },
      { path: 'promotions/add', name: 'AdminAddPromotion', component: AddPromotionPage },
      { path: 'promotions/edit/:promotionId', name: 'AdminEditPromotion', component: EditPromotionPage, props: true },
    ]
  },
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})


