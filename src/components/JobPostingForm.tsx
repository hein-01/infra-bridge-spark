import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const jobTitleOptions = [
  "Driver",
  "Rider",
  "Delivery Person",
  "Security Officer",
  "Barista",
  "Cashier",
  "Kitchen Assistant",
  "Cleaner",
  "Nanny",
  "F&B Service Crew",
  "Waiter",
  "Waitress",
  "Trainee Chef",
  "Catering Assistant",
  "Construction Worker",
  "Custom",
];

const educationOptions = [
  "Not a necessary requirement",
  "Secondary education preferred",
  "High school education preferred",
  "High School Graduates Preferred",
  "GCE O'Level",
  "Custom",
];

const formSchema = z.object({
  jobTitle: z.string().min(1, "Please select a job title"),
  customJobTitle: z.string().optional(),
  company: z.string().min(2, "Company name must be at least 2 characters"),
  location: z.string().min(1, "Please select a location"),
  jobType: z.string().min(1, "Please select a job type"),
  jobDescription: z.string().min(20, "Job description must be at least 20 characters"),
  salaryType: z.string().min(1, "Please select a salary type"),
  salary: z.string()
    .min(1, "Salary amount is required")
    .regex(/^\d+$/, "Please enter only digits (no currency symbols or spaces)"),
  ageRequirement: z.enum(["any", "18-60", "custom"]),
  ageFrom: z.number().min(18).max(100).optional(),
  ageTo: z.number().min(18).max(100).optional(),
  educationRequirement: z.string().min(1, "Please select an education requirement"),
  customEducationRequirement: z.string().optional(),
  benefits: z.array(z.string()).default([]),
  applicationDeadline: z.date({
    required_error: "Application deadline is required",
  }),
  viberNumber: z.string()
    .regex(/^09\d{7,9}$/, "Viber number must start with 09 and be valid"),
  verification: z.string()
    .regex(/^\d+$/, "Please enter only digits")
    .min(1, "Verification answer is required"),
}).refine((data) => {
  if (data.ageRequirement === "custom") {
    return data.ageFrom !== undefined && data.ageTo !== undefined && data.ageFrom <= data.ageTo;
  }
  return true;
}, {
  message: "Invalid age range. 'From' age must be less than or equal to 'To' age",
  path: ["ageTo"],
}).refine((data) => {
  if (data.jobTitle === "Custom") {
    return data.customJobTitle && data.customJobTitle.trim().length >= 3;
  }
  return true;
}, {
  message: "Custom job title must be at least 3 characters",
  path: ["customJobTitle"],
}).refine((data) => {
  if (data.educationRequirement === "Custom") {
    return data.customEducationRequirement && data.customEducationRequirement.trim().length >= 3;
  }
  return true;
}, {
  message: "Custom education requirement must be at least 3 characters",
  path: ["customEducationRequirement"],
});

type FormValues = z.infer<typeof formSchema>;

const benefitsOptions = [
  { id: "no-resume", label: "No Resume Needed (Walk-in Interview)" },
  { id: "no-experience", label: "No Experience Required" },
  { id: "seniors-welcome", label: "Seniors Welcome" },
  { id: "training-provided", label: "Training Provided" },
  { id: "flexible-hours", label: "Flexible Working Hours" },
  { id: "immediate-start", label: "Immediate Start" },
  { id: "students-ok", label: "Students OK" },
];

interface JobPostingFormProps {
  onSuccess?: () => void;
}

const JobPostingForm = ({ onSuccess }: JobPostingFormProps) => {
  const [showCustomAge, setShowCustomAge] = useState(false);
  const [showCustomJobTitle, setShowCustomJobTitle] = useState(false);
  const [showCustomEducation, setShowCustomEducation] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  
  // Generate random numbers for verification (only once on mount)
  const verificationNumbers = useMemo(() => ({
    num1: Math.floor(Math.random() * 10),
    num2: Math.floor(Math.random() * 10)
  }), []);
  
  const correctAnswer = verificationNumbers.num1 + verificationNumbers.num2;
  
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('towns');
      
      if (error) {
        console.error('Error fetching locations:', error);
        toast({
          title: "Error",
          description: "Failed to load locations",
          variant: "destructive",
        });
        return;
      }

      // Flatten the towns arrays and get unique values
      const allTowns = data
        .flatMap(location => location.towns || [])
        .filter((town, index, self) => self.indexOf(town) === index)
        .sort();
      
      setLocations(allTowns);
    };

    fetchLocations();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobTitle: "",
      company: "",
      location: "",
      jobType: "",
      jobDescription: "",
      salaryType: "",
      salary: "",
      ageRequirement: "any",
      educationRequirement: "",
      benefits: [],
      viberNumber: "",
      verification: "",
      customJobTitle: "",
      customEducationRequirement: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    // Server-side verification check
    const userAnswer = parseInt(data.verification);
    if (userAnswer !== correctAnswer) {
      toast({
        title: "Verification Failed",
        description: "Please enter the correct answer to the math question.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Job posting data:", data);
    toast({
      title: "Job Posted Successfully!",
      description: "Your job posting has been submitted.",
    });
    form.reset();
    onSuccess?.();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 rounded-lg border">
        <FormField
          control={form.control}
          name="jobTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title *</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  setShowCustomJobTitle(value === "Custom");
                  if (value !== "Custom") {
                    form.setValue("customJobTitle", "");
                  }
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job title" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background z-50">
                  {jobTitleOptions.map((title) => (
                    <SelectItem key={title} value={title}>
                      {title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {showCustomJobTitle && (
          <FormField
            control={form.control}
            name="customJobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Job Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter custom job title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name *</FormLabel>
              <FormControl>
                <Input placeholder="Your company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background z-50 max-h-[300px]">
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jobType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Work from Home">Work from Home</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="salaryType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Salary Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select salary type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="Daily Pay">Daily Pay</SelectItem>
                  <SelectItem value="Monthly Pay">Monthly Pay</SelectItem>
                  <SelectItem value="Hourly Pay">Hourly Pay</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="salary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Salary Amount(please only add digits such as 1005000): *</FormLabel>
              <FormControl>
                <Input 
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="1005000" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ageRequirement"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Minimum Age Requirements *</FormLabel>
              <FormDescription className="text-xs leading-relaxed">
                Please choose responsibly. Strict age limits (e.g., '20-30') are illegal in many regions (SG, US, UK). While drivers under 25 are statistically far more likely to get into accidents, and youth unemployment (20-30) is strongly linked to social instability and crime, excluding experienced older workers wastes talent. We urge a balanced approach that is fair to all applicants.
              </FormDescription>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value);
                    setShowCustomAge(value === "custom");
                  }}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="any" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Any age (18+)
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="18-60" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      18-60
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="custom" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Custom
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showCustomAge && (
          <div className="grid grid-cols-2 gap-4 pl-6">
            <FormField
              control={form.control}
              name="ageFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={18}
                      max={100}
                      placeholder="18"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ageTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={18}
                      max={100}
                      placeholder="100"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="educationRequirement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Education Requirements *</FormLabel>
              <FormDescription className="text-xs leading-relaxed mb-2">
                Please rethink Education Requirements before deciding which to choose. For many vital blue-collar and service roles like these, the practice of using an unnecessary education requirement (like a high school diploma or a bachelor's degree) as a simple filter to reduce the number of applicants often backfires. It not only harms your hiring process but also has significant negative impacts on applicants and society as a whole. You immediately disqualify a huge group of excellent candidates. This includes seniors with decades of hands-on experience. It disproportionately locks out qualified individuals from lower-income backgrounds, those who had to work to support their families (and couldn't attend school). When large segments of the population (especially youth) are systematically blocked from stable employment, it can lead to social unrest, economic desperation, and higher crime rates.
              </FormDescription>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  setShowCustomEducation(value === "Custom");
                  if (value !== "Custom") {
                    form.setValue("customEducationRequirement", "");
                  }
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select education requirement" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background z-50">
                  {educationOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {showCustomEducation && (
          <FormField
            control={form.control}
            name="customEducationRequirement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Education Requirement *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter custom education requirement" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="benefits"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Best Practices/Benefits</FormLabel>
                <FormDescription>
                  Select all that apply to your job posting
                </FormDescription>
              </div>
              <div className="space-y-3">
                {benefitsOptions.map((benefit) => (
                  <FormField
                    key={benefit.id}
                    control={form.control}
                    name="benefits"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={benefit.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(benefit.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, benefit.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== benefit.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {benefit.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="applicationDeadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Application Deadline *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date() || date > maxDate
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Must be within 60 days from today
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="viberNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Viber Number *</FormLabel>
              <FormControl>
                <div className="flex items-center">
                  <div className="flex items-center bg-muted px-3 h-10 rounded-l-md border border-r-0 border-input">
                    <span className="text-sm text-muted-foreground">+95</span>
                  </div>
                  <Input
                    placeholder="09xxxxxxxx"
                    className="rounded-l-none"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Enter your number starting with 09 (without country code)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="verification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification: What is {verificationNumbers.num1} + {verificationNumbers.num2}? *</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter your answer"
                  maxLength={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jobDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Description *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Please write the job description responsibly. As a platform, we provide these suggestions and facts to help you. You are free to decide what you think is most suited, knowing that it can have a significant impact on all fellow humans, just like you, and your society as a whole. Here are some suggestions: 

Please do not add discriminatory text (e.g., 'good-looking person'). Stating a preference for a 'good-looking person' or any other subjective physical trait (e.g., 'slim,' 'strong build,' 'tall') is discriminatory. It links a person's value to their appearance, not their ability. This practice is illegal in many regions. Instead of: 'Looking for a presentable (good-looking) receptionist.' Kindly say: 'Must have excellent communication skills and a professional, welcoming demeanor.' 

Please try not to use phrases like 'Chinese preferred,' 'Muslim only,' or 'Females Only.' In Singapore, for example, it is not allowed (and illegal) to mention such specific religion, race, or gender in a job description. Such specificities are only allowed if it is a Genuine Occupational Requirement (GOR). Example (Gender GOR): 'Female therapist required for female spa' or 'Male nurse needed for a men's-only ward.' Example (Religion GOR): 'Hindu priest required to perform wedding ceremonies' or 'Halal-certified butcher needed for a mosque's kitchen.' 

In SG, it's also illegal to describe stereotypes (e.g., 'females preferred for admin roles,' 'males preferred for security,' or 'Christian accountant needed') in job descriptions. Please Be Careful: 'Reverse Discrimination' is Still Discrimination. Sometimes, in an effort to promote gender equity, an employer might overcorrect and post a job like 'only female candidates for this accounting role' or 'we are only hiring women for this position.' This is still discrimination. Excluding a qualified man because he is a man is just as illegal and unfair as excluding a qualified woman. The goal of equality is not to reverse the discrimination; it's to remove it entirely. This is often seen as a more severe form of discrimination because it is done consciously. The best, safest, and fairest strategy is to be truly blind to gender. Evaluate every applicant—male or female—based on their skills, experience, and suitability for the role. The best person for the job should get it."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Post Job
        </Button>
      </form>
    </Form>
  );
};

export default JobPostingForm;
