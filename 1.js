//获取角色名字
var CUserCharacInfo_getCurCharacName = new NativeFunction(
  ptr(0x8101028),
  "pointer",
  ["pointer"],
  { abi: "sysv" }
);
//给角色发消息
var CUser_SendNotiPacketMessage = new NativeFunction(
  ptr(0x86886ce),
  "int",
  ["pointer", "pointer", "int"],
  { abi: "sysv" }
);
//获取角色上次退出游戏时间
var CUserCharacInfo_getCurCharacLastPlayTick = new NativeFunction(
  ptr(0x82a66aa),
  "int",
  ["pointer"],
  { abi: "sysv" }
);
//获取角色等级
var CUserCharacInfo_get_charac_level = new NativeFunction(
  ptr(0x80da2b8),
  "int",
  ["pointer"],
  { abi: "sysv" }
);
//获取角色当前等级升级所需经验
var CUserCharacInfo_get_level_up_exp = new NativeFunction(
  ptr(0x0864e3ba),
  "int",
  ["pointer", "int"],
  { abi: "sysv" }
);
//角色增加经验
var CUser_gain_exp_sp = new NativeFunction(
  ptr(0x866a3fe),
  "int",
  ["pointer", "int", "pointer", "pointer", "int", "int", "int"],
  { abi: "sysv" }
);
//发送道具
var CUser_AddItem = new NativeFunction(
  ptr(0x867b6d4),
  "int",
  ["pointer", "int", "int", "int", "pointer", "int"],
  { abi: "sysv" }
);
//获取角色背包
var CUserCharacInfo_getCurCharacInvenW = new NativeFunction(
  ptr(0x80da28e),
  "pointer",
  ["pointer"],
  { abi: "sysv" }
);
//减少金币
var CInventory_use_money = new NativeFunction(
  ptr(0x84ff54c),
  "int",
  ["pointer", "int", "int", "int"],
  { abi: "sysv" }
);
//增加金币
var CInventory_gain_money = new NativeFunction(
  ptr(0x84ff29c),
  "int",
  ["pointer", "int", "int", "int", "int"],
  { abi: "sysv" }
);
//通知客户端道具更新(客户端指针, 通知方式[仅客户端=1, 世界广播=0, 小队=2, war room=3], itemSpace[装备=0, 时装=1], 道具所在的背包槽)
var CUser_SendUpdateItemList = new NativeFunction(
  ptr(0x867c65a),
  "int",
  ["pointer", "int", "int", "int"],
  { abi: "sysv" }
);

//获取系统时间
var CSystemTime_getCurSec = new NativeFunction(
  ptr(0x80cbc9e),
  "int",
  ["pointer"],
  { abi: "sysv" }
);
var GlobalData_s_systemTime_ = ptr(0x941f714);

//获取系统UTC时间(秒)
function api_CSystemTime_getCurSec() {
  return GlobalData_s_systemTime_.readInt();
}

//给角色发经验
function api_CUser_gain_exp_sp(user, exp) {
  var a2 = Memory.alloc(4);
  var a3 = Memory.alloc(4);
  CUser_gain_exp_sp(user, exp, a2, a3, 0, 0, 0);
}

//给角色发道具
function api_CUser_AddItem(user, item_id, item_cnt) {
  var item_space = Memory.alloc(4);
  var slot = CUser_AddItem(user, item_id, item_cnt, 6, item_space, 0);

  if (slot >= 0) {
    //通知客户端有游戏道具更新
    CUser_SendUpdateItemList(user, 1, item_space.readInt(), slot);
  }

  return;
}

//获取角色名字
function api_CUserCharacInfo_getCurCharacName(user) {
  var p = CUserCharacInfo_getCurCharacName(user);
  if (p.isNull()) {
    return "";
  }

  return p.readUtf8String(-1);
}

//给角色发消息
function api_CUser_SendNotiPacketMessage(user, msg, msg_type) {
  var p = Memory.allocUtf8String(msg);
  CUser_SendNotiPacketMessage(user, p, msg_type);

  return;
}

//发送离线奖励
function send_offline_reward(user) {
  //当前系统时间
  var cur_time = api_CSystemTime_getCurSec();

  //用户上次退出游戏时间
  var user_last_play_time = CUserCharacInfo_getCurCharacLastPlayTick(user);

  //新创建的角色首次登陆user_last_play_time为0
  if (user_last_play_time > 0) {
    //离线时长(分钟)
    var diff_time = (cur_time - user_last_play_time) / 60;

    //离线10min后开始计算
    if (diff_time < 10) return;

    //离线奖励最多发送3天
    if (diff_time > 3 * 24 * 60) diff_time = 3 * 24 * 60;

    //经验奖励: 每分钟当前等级经验的0.2%
    var REWARD_EXP_PER_MIN = 0.002;
    //金币奖励: 每分钟当前等级*100
    var REWARD_GOLD_PER_MIN = 100;

    //计算奖励
    var cur_level = CUserCharacInfo_get_charac_level(user);
    var reward_exp = Math.floor(
      CUserCharacInfo_get_level_up_exp(user, cur_level) *
        REWARD_EXP_PER_MIN *
        diff_time
    );
    var reward_gold = Math.floor(cur_level * REWARD_GOLD_PER_MIN * diff_time);

    //发经验
    api_CUser_gain_exp_sp(user, reward_exp);
    //发金币
    CInventory_gain_money(
      CUserCharacInfo_getCurCharacInvenW(user),
      reward_gold,
      0,
      0,
      0
    );
    //通知客户端有游戏道具更新
    CUser_SendUpdateItemList(user, 1, 0, 0);

    //发消息通知客户端奖励已发送
    api_CUser_SendNotiPacketMessage(
      user,
      "离线奖励已发送(经验奖励:" +
        reward_exp +
        ", 金币奖励:" +
        reward_gold +
        ")",
      6
    );
  }
}

//发送每日首次登陆奖励
function send_first_login_reward(user) {
  //奖励道具列表(道具id, 每级奖励数量)
  var REWARD_LIST = [
    [8, 1],
    [3340, 10],
  ];

  //获取玩家登录
  var cur_level = CUserCharacInfo_get_charac_level(user);
  for (var i = 0; i < REWARD_LIST.length; i++) {
    //道具id
    var reward_item_id = REWARD_LIST[i][0];
    //道具数量
    var reward_item_cnt = 1 + Math.floor(cur_level * REWARD_LIST[i][1]);

    //发送道具到玩家背包
    api_CUser_AddItem(user, reward_item_id, reward_item_cnt);
  }
}

//角色登入登出处理
function hook_user_inout_game_world() {
  //选择角色处理函数 Hook GameWorld::reach_game_world
  Interceptor.attach(ptr(0x86c4e50), {
    //函数入口, 拿到函数参数args
    onEnter: function (args) {
      //保存函数参数
      this.user = args[1];

      //   console.log('[GameWorld::reach_game_world] this.user=' + this.user);
    },
    //原函数执行完毕, 这里可以得到并修改返回值retval
    onLeave: function (retval) {
      //给角色发消息问候
      api_CUser_SendNotiPacketMessage(
        this.user,
        "Hello " + api_CUserCharacInfo_getCurCharacName(this.user),
        2
      );

      //离线奖励处理
      send_offline_reward(this.user);
    },
  });

  //角色退出时处理函数 Hook GameWorld::leave_game_world
  Interceptor.attach(ptr(0x86c5288), {
    onEnter: function (args) {
      var user = args[1];

      //   console.log('[GameWorld::leave_game_world] user=' + user);
    },
    onLeave: function (retval) {},
  });
}

//角色每日首次登录奖励
function hook_user_first_login() {
  //角色每日重置处理函数 Hook CUser::AddDailyItem
  Interceptor.attach(ptr(0x8656caa), {
    onEnter: function (args) {
      //保存函数参数
      var user = args[0];

      //console.log('[CUser::AddDailyItem] user=' + user);

      //发送每日首次登陆奖励
      send_first_login_reward(user);
    },
    onLeave: function (retval) {},
  });
}

//从客户端封包中读取数据
var PacketBuf_get_byte = new NativeFunction(
  ptr(0x858cf22),
  "int",
  ["pointer", "pointer"],
  { abi: "sysv" }
);
var PacketBuf_get_short = new NativeFunction(
  ptr(0x858cfc0),
  "int",
  ["pointer", "pointer"],
  { abi: "sysv" }
);
var PacketBuf_get_int = new NativeFunction(
  ptr(0x858d27e),
  "int",
  ["pointer", "pointer"],
  { abi: "sysv" }
);
var PacketBuf_get_binary = new NativeFunction(
  ptr(0x858d3b2),
  "int",
  ["pointer", "pointer", "int"],
  { abi: "sysv" }
);

//服务器组包
var PacketGuard_PacketGuard = new NativeFunction(
  ptr(0x858dd4c),
  "int",
  ["pointer"],
  { abi: "sysv" }
);
var InterfacePacketBuf_put_header = new NativeFunction(
  ptr(0x80cb8fc),
  "int",
  ["pointer", "int", "int"],
  { abi: "sysv" }
);
var InterfacePacketBuf_put_byte = new NativeFunction(
  ptr(0x80cb920),
  "int",
  ["pointer", "uint8"],
  { abi: "sysv" }
);
var InterfacePacketBuf_put_short = new NativeFunction(
  ptr(0x80d9ea4),
  "int",
  ["pointer", "uint16"],
  { abi: "sysv" }
);
var InterfacePacketBuf_put_int = new NativeFunction(
  ptr(0x80cb93c),
  "int",
  ["pointer", "int"],
  { abi: "sysv" }
);
var InterfacePacketBuf_put_binary = new NativeFunction(
  ptr(0x811df08),
  "int",
  ["pointer", "pointer", "int"],
  { abi: "sysv" }
);
var InterfacePacketBuf_finalize = new NativeFunction(
  ptr(0x80cb958),
  "int",
  ["pointer", "int"],
  { abi: "sysv" }
);
var Destroy_PacketGuard_PacketGuard = new NativeFunction(
  ptr(0x858de80),
  "int",
  ["pointer"],
  { abi: "sysv" }
);

//从客户端封包中读取数据(失败会抛异常, 调用方必须做异常处理)
function api_PacketBuf_get_byte(packet_buf) {
  var data = Memory.alloc(1);

  if (PacketBuf_get_byte(packet_buf, data)) {
    return data.readU8();
  }

  throw new Error("PacketBuf_get_byte Fail!");
}
function api_PacketBuf_get_short(packet_buf) {
  var data = Memory.alloc(2);

  if (PacketBuf_get_short(packet_buf, data)) {
    return data.readShort();
  }

  throw new Error("PacketBuf_get_short Fail!");
}
function api_PacketBuf_get_int(packet_buf) {
  var data = Memory.alloc(4);

  if (PacketBuf_get_int(packet_buf, data)) {
    return data.readInt();
  }

  throw new Error("PacketBuf_get_int Fail!");
}
function api_PacketBuf_get_binary(packet_buf, len) {
  var data = Memory.alloc(len);

  if (PacketBuf_get_binary(packet_buf, data, len)) {
    return data.readByteArray(len);
  }

  throw new Error("PacketBuf_get_binary Fail!");
}

//获取原始封包数据
function api_PacketBuf_get_buf(packet_buf) {
  return packet_buf.add(20).readPointer().add(13);
}

//获取GameWorld实例
var G_GameWorld = new NativeFunction(ptr(0x80da3a7), "pointer", [], {
  abi: "sysv",
});
//根据server_id查找user
var GameWorld_find_from_world = new NativeFunction(
  ptr(0x86c4b9c),
  "pointer",
  ["pointer", "int"],
  { abi: "sysv" }
);
//城镇瞬移
var GameWorld_move_area = new NativeFunction(
  ptr(0x86c5a84),
  "pointer",
  [
    "pointer",
    "pointer",
    "int",
    "int",
    "int",
    "int",
    "int",
    "int",
    "int",
    "int",
    "int",
  ],
  { abi: "sysv" }
);

//处理GM信息
function hook_gm_command() {
  //HOOK Dispatcher_New_Gmdebug_Command::dispatch_sig
  Interceptor.attach(ptr(0x820bbde), {
    onEnter: function (args) {
      //获取原始封包数据
      var raw_packet_buf = api_PacketBuf_get_buf(args[2]);

      //解析GM DEBUG命令
      var msg_len = raw_packet_buf.readInt();
      var msg = raw_packet_buf.add(4).readUtf8String(msg_len);

      var user = args[1];

      console.log(
        "收到GM_DEBUG消息: [" +
          api_CUserCharacInfo_getCurCharacName(user) +
          "] " +
          msg
      );

      //去除命令开头的 '//'
      msg = msg.slice(2);

      if (msg == "test") {
        //向客户端发送消息
        api_CUser_SendNotiPacketMessage(user, "这是一条测试命令", 1);

        //执行一些测试代码

        return;
      } else if (msg.indexOf("move ") == 0) {
        //城镇瞬移
        var msg_group = msg.split(" ");
        if (msg_group.length == 5) {
          var village = parseInt(msg_group[1]);
          var area = parseInt(msg_group[2]);
          var pos_x = parseInt(msg_group[3]);
          var pos_y = parseInt(msg_group[4]);
          GameWorld_move_area(
            G_GameWorld(),
            user,
            village,
            area,
            pos_x,
            pos_y,
            0,
            0,
            0,
            0,
            0
          );
        } else {
          api_CUser_SendNotiPacketMessage(
            user,
            "格式错误. 使用示例: //move 2 1 100 100",
            2
          );
        }
      }
    },
    onLeave: function (retval) {},
  });
}

//本地时间戳
function get_timestamp() {
  var date = new Date();
  date = new Date(date.setHours(date.getHours() + 10)); //转换到本地时间
  var year = date.getFullYear().toString();
  var month = (date.getMonth() + 1).toString();
  var day = date.getDate().toString();
  var hour = date.getHours().toString();
  var minute = date.getMinutes().toString();
  var second = date.getSeconds().toString();
  var ms = date.getMilliseconds().toString();

  return (
    year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second
  );
}

//linux创建文件夹
function api_mkdir(path) {
  var opendir = new NativeFunction(
    Module.getExportByName(null, "opendir"),
    "int",
    ["pointer"],
    { abi: "sysv" }
  );
  var mkdir = new NativeFunction(
    Module.getExportByName(null, "mkdir"),
    "int",
    ["pointer", "int"],
    { abi: "sysv" }
  );
  var path_ptr = Memory.allocUtf8String(path);
  if (opendir(path_ptr)) return true;
  return mkdir(path_ptr, 0x1ff);
}

//服务器环境
var G_CEnvironment = new NativeFunction(ptr(0x080cc181), "pointer", [], {
  abi: "sysv",
});
//获取当前服务器配置文件名
var CEnvironment_get_file_name = new NativeFunction(
  ptr(0x80da39a),
  "pointer",
  ["pointer"],
  { abi: "sysv" }
);

//获取当前频道名
function api_CEnvironment_get_file_name() {
  var filename = CEnvironment_get_file_name(G_CEnvironment());
  return filename.readUtf8String(-1);
}

//文件记录日志
var frida_log_dir_path = "./frida_log/";
var f_log = null;
var log_day = null;
function log(msg) {
  var date = new Date();
  date = new Date(date.setHours(date.getHours() + 10)); //转换到本地时间
  var year = date.getFullYear().toString();
  var month = (date.getMonth() + 1).toString();
  var day = date.getDate().toString();
  var hour = date.getHours().toString();
  var minute = date.getMinutes().toString();
  var second = date.getSeconds().toString();
  var ms = date.getMilliseconds().toString();

  //日志按日期记录
  if (f_log == null || log_day != day) {
    api_mkdir(frida_log_dir_path);
    f_log = new File(
      frida_log_dir_path +
        "frida_" +
        api_CEnvironment_get_file_name() +
        "_" +
        year +
        "_" +
        month +
        "_" +
        day +
        ".log",
      "a+"
    );
    log_day = day;
  }

  //时间戳
  var timestamp =
    year +
    "-" +
    month +
    "-" +
    day +
    " " +
    hour +
    ":" +
    minute +
    ":" +
    second +
    "." +
    ms;

  //控制台日志
  console.log("[" + timestamp + "]" + msg + "\n");

  //文件日志
  f_log.write("[" + timestamp + "]" + msg + "\n");
  //立即写日志到文件中
  f_log.flush();
}

//生成随机整数(不包含max)
function get_random_int(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

//内存十六进制打印
function bin2hex(p, len) {
  var hex = "";
  for (var i = 0; i < len; i++) {
    var s = p.add(i).readU8().toString(16);
    if (s.length == 1) s = "0" + s;
    hex += s;
    if (i != len - 1) hex += " ";
  }
  return hex;
}

function start() {
  log("++++++++++++++++++++ frida init ++++++++++++++++++++");
  //使用10个道具3340
  use_item(3340, 10);
  log("1");
}

//延迟加载插件
function awake() {
  //Hook check_argv
  Interceptor.attach(ptr(0x829ea5a), {
    onEnter: function (args) {},
    onLeave: function (retval) {
      //等待check_argv函数执行结束 再加载插件
      start();
    },
  });
}
//所有账号角色开启GM权限
function hook_check_gm() {
  //GM账户
  //WongWork::CGMAccounts::isGM
  Interceptor.attach(ptr(0x8109346), {
    onEnter: function (args) {},
    onLeave: function (retval) {
      //强制返回true
      retval.replace(1);
    },
  });

  //GM角色
  //CUser::isGMUser
  Interceptor.attach(ptr(0x814589c), {
    onEnter: function (args) {},
    onLeave: function (retval) {
      //强制返回true
      retval.replace(1);
    },
  });
}

//解除每日创建角色数量限制
function disable_check_create_character_limit() {
  //DB_CreateCharac::CheckLimitCreateNewCharac
  Interceptor.attach(ptr(0x8401922), {
    onEnter: function (args) {},
    onLeave: function (retval) {
      //强制返回允许创建
      retval.replace(1);
    },
  });
}

function use_item(item_id, count) {
  //道具使用函数地址
  var use_item_addr = ptr(
    "0x" + Module.findExportByName(null, "UseItem").toString(16)
  );
  //使用道具
  for (var i = 0; i < count; i++) {
    //查找道具在物品栏的位置
    var item_slot = find_item_slot(item_id);
    if (item_slot == null) {
      log("未找到道具:" + item_id);
      break;
    }

    var use_item_arg = Memory.alloc(8);
    use_item_arg.writePointer(item_slot);
    use_item_arg.writeU32(1);
    use_item_arg.writeU32(0);

    var ret = use_item_addr(use_item_arg);
    if (ret == 0) {
      log("使用道具失败");
      break;
    }
  }
}

function find_item_slot(item_id) {
  var object = new NativeFunction(
    ptr("0x" + Module.findExportByName(null, "FindObject").toString(16)),
    "pointer",
    ["pointer", "int"],
    { abi: "sysv" }
  )(ptr(0x81660a8), item_id);

  if (object == null) {
    log("未找到道具:" + item_id);
    return null;
  }

  var item_slot_offset = ptr("0x" + (0x88 + 0x20).toString(16));
  var item_slot = object.add(item_slot_offset).readU16();
  return ptr(0x829db50 + item_slot * 2);
}

rpc.exports = {
  init: function (stage, parameters) {
    if (stage == "early") {
      awake();
    } else {
      start();
    }
  },
  dispose: function () {
    console.log("[dispose]");
  },
};
