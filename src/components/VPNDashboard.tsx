import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, MapPin, Activity, Download, Upload, Settings, Globe } from "lucide-react";

export const VPNDashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedServer, setSelectedServer] = useState("United States");
  const [connectionTime, setConnectionTime] = useState("00:00:00");
  const [dataUsed, setDataUsed] = useState({ download: "0 MB", upload: "0 MB" });

  const servers = [
    { name: "United States", flag: "🇺🇸", ping: "45ms" },
    { name: "United Kingdom", flag: "🇬🇧", ping: "32ms" },
    { name: "Germany", flag: "🇩🇪", ping: "28ms" },
    { name: "Japan", flag: "🇯🇵", ping: "89ms" },
    { name: "Canada", flag: "🇨🇦", ping: "52ms" },
    { name: "Australia", flag: "🇦🇺", ping: "112ms" }
  ];

  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(!isConnected);
      setIsConnecting(false);
    }, 2000);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isConnected) {
      interval = setInterval(() => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        setConnectionTime(`${hours}:${minutes}:${seconds}`);
        
        // Simulate data usage
        setDataUsed({
          download: `${Math.floor(Math.random() * 100 + 10)} MB`,
          upload: `${Math.floor(Math.random() * 20 + 2)} MB`
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  const getStatusColor = () => {
    if (isConnecting) return "text-vpn-connecting";
    return isConnected ? "text-vpn-connected" : "text-vpn-disconnected";
  };

  const getStatusText = () => {
    if (isConnecting) return "Connecting...";
    return isConnected ? "Connected" : "Disconnected";
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-8">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">SecureVPN</h1>
        </div>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Connection Card */}
      <Card className="p-8 text-center space-y-6 bg-card/50 backdrop-blur-lg border-border/50">
        <div className="space-y-2">
          <div className={`flex items-center justify-center space-x-2 ${getStatusColor()}`}>
            <Activity className="h-5 w-5" />
            <span className="text-lg font-semibold">{getStatusText()}</span>
          </div>
          {isConnected && (
            <div className="text-sm text-muted-foreground">
              Protected • {connectionTime}
            </div>
          )}
        </div>

        <div className="relative">
          <div 
            className={`w-32 h-32 mx-auto rounded-full border-4 transition-all duration-300 ${
              isConnected 
                ? "border-vpn-connected shadow-[0_0_30px_hsl(var(--vpn-connected)/0.3)]" 
                : isConnecting 
                ? "border-vpn-connecting animate-pulse" 
                : "border-border"
            }`}
          >
            <Button
              variant="ghost"
              size="icon"
              className={`w-full h-full rounded-full transition-all duration-300 ${
                isConnected 
                  ? "bg-vpn-connected/10 hover:bg-vpn-connected/20" 
                  : isConnecting
                  ? "bg-vpn-connecting/10"
                  : "hover:bg-muted/20"
              }`}
              onClick={handleConnect}
              disabled={isConnecting}
            >
              <Shield className={`h-12 w-12 ${getStatusColor()}`} />
            </Button>
          </div>
        </div>

        <Button 
          onClick={handleConnect} 
          disabled={isConnecting}
          className="w-full py-6 text-lg font-semibold bg-primary hover:bg-primary/90"
        >
          {isConnecting ? "Connecting..." : isConnected ? "Disconnect" : "Connect"}
        </Button>
      </Card>

      {/* Server Selection */}
      <Card className="p-6 bg-card/50 backdrop-blur-lg border-border/50">
        <div className="flex items-center space-x-2 mb-4">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Server Location</h2>
        </div>
        <div className="space-y-3">
          {servers.map((server) => (
            <div
              key={server.name}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                selectedServer === server.name
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-secondary/30 hover:bg-secondary/50"
              }`}
              onClick={() => setSelectedServer(server.name)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{server.flag}</span>
                <span className="font-medium">{server.name}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {server.ping}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Data Usage */}
      {isConnected && (
        <Card className="p-6 bg-card/50 backdrop-blur-lg border-border/50">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Data Usage</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-secondary/30 rounded-lg">
              <Download className="h-5 w-5 text-vpn-connected" />
              <div>
                <div className="text-sm text-muted-foreground">Download</div>
                <div className="font-semibold">{dataUsed.download}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-secondary/30 rounded-lg">
              <Upload className="h-5 w-5 text-accent" />
              <div>
                <div className="text-sm text-muted-foreground">Upload</div>
                <div className="font-semibold">{dataUsed.upload}</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Features */}
      <Card className="p-6 bg-card/50 backdrop-blur-lg border-border/50">
        <div className="flex items-center space-x-2 mb-4">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">VPN Features</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <span>Kill Switch</span>
            <Badge variant="secondary" className="bg-vpn-connected/20 text-vpn-connected">
              Active
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <span>DNS Leak Protection</span>
            <Badge variant="secondary" className="bg-vpn-connected/20 text-vpn-connected">
              Enabled
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <span>Auto Connect</span>
            <Badge variant="secondary" className="bg-muted/20 text-muted-foreground">
              Disabled
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};