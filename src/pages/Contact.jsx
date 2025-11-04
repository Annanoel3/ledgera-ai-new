import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Contact() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return null;
      }
      return await base44.auth.me();
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0];
    },
    enabled: !!user,
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data) => {
      await base44.integrations.Core.SendEmail({
        from_name: "Ledgera AI Contact Form",
        to: "annabairdballew@gmail.com",
        subject: `Contact Form: ${data.name}`,
        body: `From: ${data.name} (${data.email})\n\n${data.message}`
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    sendEmailMutation.mutate({ name, email, message });
  };

  return (
    <div className="p-6 md:p-8 min-h-screen" style={{ backgroundColor: profile?.darkMode ? '#0f0f0f' : '#f9fafb' }}>
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2"
          style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <h1 className="text-3xl font-bold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
          Contact Us
        </h1>
        <p className="mb-8" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
          Have questions or feedback? We'd love to hear from you.
        </p>

        {submitted ? (
          <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>
                Message Sent!
              </h3>
              <p className="text-center mb-4" style={{ color: profile?.darkMode ? '#9ca3af' : '#6b7280' }}>
                Thank you for contacting us. We'll get back to you soon.
              </p>
              <Button onClick={() => setSubmitted(false)} className="bg-[#22A699] hover:bg-[#1d8d82]">
                Send Another Message
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card style={{ backgroundColor: profile?.darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${profile?.darkMode ? '#374151' : '#e5e7eb'}` }}>
            <CardHeader>
              <CardTitle style={{ color: profile?.darkMode ? '#ffffff' : '#111827' }}>Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    style={{
                      backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                      border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                      color: profile?.darkMode ? '#ffffff' : '#111827'
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="email" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    style={{
                      backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                      border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                      color: profile?.darkMode ? '#ffffff' : '#111827'
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="message" style={{ color: profile?.darkMode ? '#d1d5db' : '#374151' }}>Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help you?"
                    rows={6}
                    required
                    style={{
                      backgroundColor: profile?.darkMode ? '#374151' : '#ffffff',
                      border: `1px solid ${profile?.darkMode ? '#4b5563' : '#e5e7eb'}`,
                      color: profile?.darkMode ? '#ffffff' : '#111827'
                    }}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={sendEmailMutation.isPending}
                  className="w-full bg-[#22A699] hover:bg-[#1d8d82] gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sendEmailMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}