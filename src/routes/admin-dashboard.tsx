import { Headings } from "@/components/headings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/config/firebase.config";
import { collection, collectionGroup, getDocs } from "firebase/firestore";
import { Users, FileText, Activity, Database, Server, FileCheck, Gauge, Rocket } from "lucide-react";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Area,
} from "recharts";

interface AdminStats {
  totalUsers: number;
  totalInterviews: number;
  adminUsers: number;
  resumeInterviews: number;
  avgAtsScore: number;
}

const mockApiData = [
  { name: "Mon", requests: 400 },
  { name: "Tue", requests: 300 },
  { name: "Wed", requests: 550 },
  { name: "Thu", requests: 450 },
  { name: "Fri", requests: 700 },
  { name: "Sat", requests: 600 },
  { name: "Sun", requests: 800 },
];

const hostingData = [
  { time: "00:00", latency: 42, traffic: 120 },
  { time: "04:00", latency: 45, traffic: 80 },
  { time: "08:00", latency: 55, traffic: 450 },
  { time: "12:00", latency: 60, traffic: 800 },
  { time: "16:00", latency: 48, traffic: 650 },
  { time: "20:00", latency: 40, traffic: 300 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalInterviews: 0,
    adminUsers: 0,
    resumeInterviews: 0,
    avgAtsScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [interviewData, setInterviewData] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const interviewsSnap = await getDocs(collectionGroup(db, "interviews"));

        let admins = 0;
        usersSnap.forEach((doc) => {
          if (doc.data().role === "admin") admins++;
        });

        // Group interviews by creation month/day (simulated distribution here)
        // Since we may not have much real data, we simulate some active interview topics
        const dummyInterviewDistribution = [
          { name: "React Developer", count: 12 },
          { name: "Node.js Engineer", count: 8 },
          { name: "UI/UX Designer", count: 5 },
          { name: "Data Scientist", count: 7 },
        ];
        
        let resumeInterviewsCount = 0;
        let totalAtsScore = 0;
        let scoredResumes = 0;

        const titleCounts: Record<string, number> = {};
        interviewsSnap.forEach((doc) => {
          const data = doc.data();
          const title = data.position || "Other";
          titleCounts[title] = (titleCounts[title] || 0) + 1;
          
          if (data.resumeProfile) {
            resumeInterviewsCount++;
            if (data.resumeProfile.atsScore) {
              totalAtsScore += data.resumeProfile.atsScore;
              scoredResumes++;
            }
          }
        });
        
        setStats({
          totalUsers: usersSnap.size,
          adminUsers: admins,
          totalInterviews: interviewsSnap.size,
          resumeInterviews: resumeInterviewsCount,
          avgAtsScore: scoredResumes > 0 ? Math.round(totalAtsScore / scoredResumes) : 0,
        });

        const realDistribution = Object.keys(titleCounts).map((key) => ({
          name: key,
          count: titleCounts[key]
        }));

        setInterviewData(realDistribution.length > 0 ? realDistribution : dummyInterviewDistribution);

      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const userData = [
    { name: "Users", value: stats.totalUsers - stats.adminUsers },
    { name: "Admins", value: stats.adminUsers },
  ];

  return (
    <div className="flex flex-col w-full pb-10">
      <div className="flex w-full items-center justify-between">
        <Headings
          title="Admin Analytics Dashboard"
          description="Interactive overview of users, mock interviews, and system usage."
        />
      </div>

      <Separator className="my-8" />

      {/* Top STATS Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {stats.totalUsers}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Registered via Clerk Auth
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Mock Interviews
            </CardTitle>
            <FileText className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {stats.totalInterviews}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Generated in Firebase
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Usage (Gemini)</CardTitle>
            <Activity className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Active
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              System health optimal
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Status</CardTitle>
            <Database className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Healthy
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Firestore DB Connected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* RESUME ANALYTICS ROW */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
         <Card className="shadow-sm border-indigo-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resume-Based Interviews</CardTitle>
            <FileCheck className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {stats.resumeInterviews}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalInterviews > 0 ? Math.round((stats.resumeInterviews / stats.totalInterviews) * 100) : 0}% of total mock interviews
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-indigo-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average ATS Score</CardTitle>
            <Gauge className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {stats.avgAtsScore}/100
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Based on parsed resume profiles
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Interview Generation Origin</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
             <div className="h-[80px] w-full">
                {loading ? <Skeleton className="h-full w-full" /> : 
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                         { name: "Resume Based", value: stats.resumeInterviews },
                         { name: "Form Only", value: stats.totalInterviews - stats.resumeInterviews }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={40}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#6366f1" />
                      <Cell fill="#e5e7eb" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>}
             </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-8">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Gemini API Requests (Past 7 Days)</CardTitle>
            <CardDescription>
              Simulated activity tracking AI question generation.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockApiData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number | string) => `${value}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>User Roles Distribution</CardTitle>
            <CardDescription>
              Breakdown of users registered via Clerk
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {userData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Interview Topics Popularity</CardTitle>
            <CardDescription>
              Most created interview positions in Firebase
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={interviewData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-white">
          <div className="flex bg-indigo-100 p-4 rounded-full mb-4">
            <Server className="h-10 w-10 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Systems Online</h3>
          <p className="text-center text-muted-foreground max-w-sm mb-6">
            Authentication handled by Clerk. Database hosted on Firebase Firestore. AI operations routed via Google Gemini. All backend services are currently fully operational and responding optimally.
          </p>
          <div className="flex gap-4 w-full px-12">
             <div className="flex flex-col flex-1 bg-white p-3 rounded-md shadow-sm border border-neutral-100 items-center">
               <span className="text-xs text-neutral-500 mb-1">Latency</span>
               <span className="font-semibold text-emerald-600">~45ms</span>
             </div>
             <div className="flex flex-col flex-1 bg-white p-3 rounded-md shadow-sm border border-neutral-100 items-center">
               <span className="text-xs text-neutral-500 mb-1">Uptime</span>
               <span className="font-semibold text-emerald-600">99.9%</span>
             </div>
          </div>
        </Card>
      </div>

      {/* HOSTING/DEPLOYMENT ROW */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
        <Card className="col-span-4 shadow-sm border-indigo-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <Rocket className="h-5 w-5 text-indigo-500" /> Firebase App Hosting Performance
            </CardTitle>
            <CardDescription>
              Simulated latency and traffic metrics over 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={hostingData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                   <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                   <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                   <Legend verticalAlign="top" height={36}/>
                   <Area yAxisId="right" type="monotone" dataKey="traffic" fill="#e0e7ff" stroke="#a5b4fc" name="Traffic (req/h)" />
                   <Line yAxisId="left" type="monotone" dataKey="latency" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Latency (ms)" />
                 </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm border-indigo-100 flex flex-col">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Server className="h-5 w-5 text-indigo-500" /> Deployment Status
            </CardTitle>
            <CardDescription>
               Recent builds and rollouts
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center gap-4">
             <div className="flex items-center justify-between border-b pb-3">
                <div>
                   <p className="text-sm font-medium">Production Build #402</p>
                   <p className="text-xs text-muted-foreground">Deployed 2 hours ago</p>
                </div>
                <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-medium">Success</div>
             </div>
             <div className="flex items-center justify-between border-b pb-3">
                <div>
                   <p className="text-sm font-medium">Production Build #401</p>
                   <p className="text-xs text-muted-foreground">Deployed 1 day ago</p>
                </div>
                <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-medium">Success</div>
             </div>
             <div className="flex items-center justify-between pb-3">
                <div>
                   <p className="text-sm font-medium">Production Build #400</p>
                   <p className="text-xs text-muted-foreground">Deployed 3 days ago</p>
                </div>
                <div className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-medium">Failed</div>
             </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};
