import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import jobBannerBg from "@/assets/job-banner-bg.jpg";

const FindJobs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-8">
        {/* Banner Section */}
        <div 
          className="relative h-[300px] md:h-[400px] bg-cover bg-center flex items-center justify-center"
          style={{ backgroundImage: `url(${jobBannerBg})` }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" />
          
          {/* Content */}
          <div className="relative z-10 text-center px-4">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 animate-fade-in">
              Listing your job for free, click here
            </h2>
            <Button 
              size="lg"
              onClick={() => navigate("/post-a-job")}
              className="text-lg px-8 py-6 hover-scale"
            >
              Post a job FREE
            </Button>
          </div>
        </div>

        {/* Jobs Listing Section */}
        <div className="container mx-auto px-4 pt-12">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-2">Find Jobs</h1>
            <p className="text-muted-foreground mb-8">Browse available job opportunities</p>
            
            {/* Job listings would go here */}
            <div className="text-center py-12 text-muted-foreground">
              No jobs posted yet. Be the first to post a job!
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FindJobs;
