import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function Home() {
  const [text, setText] = useState(""); const [message, setMessage] = useState("");
  async function send() {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000"}/v1/commands`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, source: "text" }) });
    const result = await response.json(); setMessage(`${result.intent}: ${result.summary}`); setText("");
  }
  return <SafeAreaView style={s.root}><StatusBar style="light"/><View style={s.content}><Text style={s.brand}>JRAVIS ●</Text><Text style={s.kicker}>RAQAMLI IKKINCHI MIYA</Text><Text style={s.title}>Bugun nimani{`\n`}bajaray?</Text><TextInput style={s.input} multiline placeholder="Buyruq yozing…" placeholderTextColor="#65707b" value={text} onChangeText={setText}/><TouchableOpacity style={s.button} onPress={send} disabled={!text.trim()}><Text style={s.buttonText}>Bajarish →</Text></TouchableOpacity>{message ? <Text style={s.result}>{message}</Text> : null}</View></SafeAreaView>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:"#090b0f"},content:{flex:1,padding:28,justifyContent:"center"},brand:{color:"#40e0b5",fontWeight:"900",letterSpacing:3},kicker:{color:"#40e0b5",fontSize:11,fontWeight:"800",letterSpacing:2,marginTop:70},title:{color:"#f6f7f9",fontSize:48,fontWeight:"800",lineHeight:52,marginVertical:20},input:{minHeight:110,borderWidth:1,borderColor:"#29313a",borderRadius:16,color:"white",padding:18,fontSize:17,textAlignVertical:"top",backgroundColor:"#11151b"},button:{backgroundColor:"#40e0b5",padding:18,borderRadius:14,marginTop:12,alignItems:"center"},buttonText:{color:"#04110e",fontWeight:"900"},result:{color:"#b8c2cc",marginTop:24,lineHeight:22}});

