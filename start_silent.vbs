Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = appDir

' 1. Giai phong cong 3005 neu co tien trinh cu dang chiem dung
WshShell.Run "cmd /c for /f ""tokens=5"" %a in ('netstat -aon ^| findstr "":3005"" ^| findstr ""LISTENING""') do taskkill /f /pid %a >nul 2>&1", 0, True

' 2. Khoi dong may chu ngam hoan toan (WindowStyle = 0: Khong hien thi cua so CMD)
WshShell.Run "cmd /c """ & appDir & "\start_server.bat""", 0, False

' 3. Cho 2.5 giay de may chu san sang roi mo trinh duyet
WScript.Sleep 2500
WshShell.Run "cmd /c start http://localhost:3005", 0, False
