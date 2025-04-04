import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { senderDetailsSchema, type SenderDetails, emailToneEnum } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface SenderDetailsFormProps {
  onSubmit: (data: SenderDetails) => void;
  initialData: SenderDetails | null;
  isActive: boolean;
}

export default function SenderDetailsForm({
  onSubmit,
  initialData,
  isActive
}: SenderDetailsFormProps) {
  // Create form with zod validation
  const form = useForm<SenderDetails>({
    resolver: zodResolver(senderDetailsSchema),
    defaultValues: initialData || {
      name: "",
      company: "",
      productDescription: "",
      emailTone: "professional"
    }
  });

  // Submit handler
  const handleSubmit = (data: SenderDetails) => {
    onSubmit(data);
  };

  return (
    <Card className={`bg-white rounded-lg shadow overflow-hidden ${!isActive ? 'opacity-90' : ''}`}>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium text-gray-900">Sender Information</h3>
        <p className="mt-1 text-sm text-gray-600">This information will be used to personalize the emails.</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-6 space-y-6">
            {/* Sender Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Your Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John Doe" 
                      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Company Name */}
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Company Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Acme Inc." 
                      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Product/Service Description */}
            <FormField
              control={form.control}
              name="productDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Product/Service Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what you are selling..." 
                      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <p className="mt-2 text-sm text-gray-500">Brief description of your product or service offering.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Email Tone Selection */}
            <FormField
              control={form.control}
              name="emailTone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Email Tone</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="focus:ring-primary focus:border-primary">
                        <SelectValue placeholder="Select a tone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="persuasive">Persuasive</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Continue to Upload
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
