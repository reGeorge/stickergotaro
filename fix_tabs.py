import re

with open('src/pages/home/index.tsx', 'r') as f:
    content = f.read()

replacement = """          >
            <Text>🏆 恒心榜单</Text>
          </View>
          
          {/* Draft Trigger Button (Phase 2 Addon) */}
          {activeTab === 'daily' && (
             <View 
                 className="absolute -right-1 -top-4 bg-gradient-to-br from-yellow-300 to-orange-400 text-white w-12 h-12 rounded-full flex flex-col items-center justify-center shadow-lg transform rotate-12 active:scale-95 animate-[pop-in_0.5s_ease-out] z-20 border-2 border-white"
                 onClick={() => setShowTaskDraft(true)}
             >
                 <Text className="text-xl">🎒</Text>
             </View>
          )}
        </View>"""

content = content.replace("""          >
            <Text>🏆 恒心榜单</Text>
          </View>
        </View>""", replacement)

with open('src/pages/home/index.tsx', 'w') as f:
    f.write(content)

