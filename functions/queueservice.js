const Instagram = require("./instagram");
const Queue = require("../models/queue");
const logger = require("./eventService");
const Service = require("./service");
const Configuration = require("../models/configuration");
const cron = require("node-cron");
const path = require("path");
const u = require("./utils").getInstance();
const __ = require("underscore");

class QueueService extends Service {
  constructor() {
    super();
  }

  getComponent() {
    const filePath = __filename;
    return path.basename(filePath);
  }

  async postQueueItem(queueId) {
    const instagram = new Instagram('yorch');
    const queue = await Queue.findOne({ _id: this.getObjectId(queueId) });
    let result = await instagram.post(queue.feedId, true, queue);
    if(result.status == "ok") {
      queue.status = "posted";      ;
      queue.publishedCount = queue.publishedCount++;      
    } else {
      queue.status = "error";
    }

    queue.posted = Date.now();   
    await queue.save();
  }

  async processQueue(params) {
    console.log(`Owner Queue: ${params.owner}`);
    const instagram = new Instagram(params.owner);
    const results = [];

    const queue = await Queue.find({ status: params.status, type: "normal", owner: params.owner }).sort({ priority: 1 }).limit(params.limit);

    if (queue.length > 0) {
      for (let q of queue) {
        let result = await instagram.post(q.feedId, true, q);

        if(result.status == "ok") {
          q.status = "posted";          
          q.publishedCount = q.publishedCount++;         
        } else {
          q.status = "error";                    
          
        }

        q.posted = Date.now();
        results.push(q);
        await q.save();

        logger.terminal({ message: `sleeping: ${params.sleepTime} milliseconds.`, component: this.getComponent(), owner: params.owner });
        await u.sleep(params.sleepTime);
      }
      //await this.updatePriorities(params);
    } else {
      logger.terminal({ message: `No queue items with status [${params.status}]`, component: this.getComponent(), owner: params.owner });
    }

    return results;
  }

  async updatePriorities(params) {
    const promises = [];
    const queue = await Queue.find({ status: params.status });

    for (let item of queue) {
      if (!isNaN(item.priority)) {
        const newPriority = --item.priority;
        if (newPriority > 0) {
          item.priority = newPriority;
          promises.push(item.save());
        }
      }
    }

    logger.terminal({ message: `Updating priorities.`, component: this.getComponent() });

    return Promise.all(promises);
  }

  async countProcessQueue(status) {
    const queue = await Queue.countDocuments({ status: status });
    return queue;
  }

  async setCronJob(owner) {
    const configurationCron = await Configuration.findOne({ id: "cron", owner });
    const configurationLimit = await Configuration.findOne({ id: "limit", owner });

    if (configurationCron && configurationLimit) {
      if (QueueService.cronJobs.length > 0) {
        const jobIndex = QueueService.cronJobs.findIndex(j => j.owner === owner);
        const cron = QueueService.cronJobs.find(j => j.owner === owner);

        if (cron) {
          logger.event({ message: `Destroying CRON for ${owner}`, component: __filename, owner });
          cron.job.destroy();
          cron.job = null;

          QueueService.cronJobs.splice(jobIndex, 1);
        }
      }

      logger.terminal({
        component: this.getComponent(),
        message: `Initializing  CRON for [${owner}] with configuration CRON:[${configurationCron.value}] LIMIT:[${configurationLimit.value}]`,
        owner
      });

      const job = cron.schedule(
        configurationCron.value,
        _ => {
          logger.terminal({ message: `Running CRON job. [${configurationCron.value}][${configurationLimit.value}]`, component: this.getComponent(), owner });
          this.processQueue({
            status: "active",
            sleepTime: 60000,
            limit: parseInt(configurationLimit.value),
            owner
          });
        },
        {
          scheduled: false
        }
      );

      QueueService.cronJobs.push({
        owner,
        job
      });

      job.start();
    } else {
      logger.log({ message: `No configuration found for owner ${owner}` });
    }
  }

  async createJob() {
    const id = u.guid();
    const self = this;

    setInterval(async _ => {
      const promises = [];
      const updateQueueStatus = [];
      const queueToBeProcessed = [];

      const queues = await Queue.find({ status: "active", $or: [{ type: "priority" }, { type: "inmediate" }] });

      var date = new Date();

      for (let pQ of queues) {
        const nextRunTime = pQ.nextRunTime;
        const offSet = pQ.offSet || date.getTimezoneOffset();
        const now_utc = new Date(date.getTime() + offSet * 60000);

        var diff = (nextRunTime - now_utc) / 1000;

        if (diff <= 30 || diff <= 0) {
          logger.event({ message: `Locking ${pQ._id} ${pQ.username}`, component: __filename, owner: pQ.owner });
          queueToBeProcessed.push(pQ);
          promises.push(
            (_ => {
              pQ.status = "locked";
              return pQ.save();
            })()
          );
        }
      }

      await Promise.all(promises);
      const sleepTime = 15000;
      for (const pQ of queueToBeProcessed) {
        updateQueueStatus.push(
          (async _ => {
            try {
              const instagram = new Instagram(pQ.owner);
              await instagram.post(pQ.feedId, true, pQ);
              const queue = await Queue.findOne({ _id: self.getObjectId(pQ._id) });

              logger.event({ message: `Changing status from 'locked' to 'posted'.`, component: __filename, owner: pQ.owner });
              queue.status = "posted";
              queue.posted = Date.now();
              queue.publishedCount = ++queue.publishedCount;

              return queue.save();
            } catch (e) {
              logger.error({ message: `${pQ.username} - ${pQ._id} - ${pQ.feedId}: ${e.message}`, stack: e.stack });
              const queue = Queue.findOne({ _id: self.getObjectId(pQ._id) });
              queue.status = "error";
              return queue.save();
            }
          })()
        );
        logger.log({ message: `Sleeping ${sleepTime / 1000} seconds before to process next priority queue item`, component: __filename, owner: pQ.owner });
        await u.sleep(sleepTime);
      }
      await Promise.all(updateQueueStatus);
    }, 60000);

    return id;
  }
}

QueueService.cronJob = null;
QueueService.cronJobs = [];

module.exports = QueueService;
