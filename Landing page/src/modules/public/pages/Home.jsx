// src/pages/Home.jsx
import Banner from '../components/Banner/Banner';
import Services from '../components/Services/Services';
import VideoShowcase from '../components/VideoShowcase/VideoShowcase';
import Testimonials from '../components/Testimonials/Testimonials';
import WhyChooseUs from '../components/WhyChooseUs/WhyChooseUs';
import TrustedBy from '../components/TrustedBy/TrustedBy';
import DevProject from '../components/DevProject/DevProject';
import BookCall from '../components/BookCall/BookCall';



const Home = () => {
  return (
    <>

     
      <Banner />
      <WhyChooseUs />

      <Services />

      <BookCall />
      <VideoShowcase />
      <DevProject />
      <BookCall />


      <Testimonials />
      <TrustedBy />


 

      
    </>
  );
};

export default Home;
