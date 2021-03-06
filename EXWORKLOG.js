//
//    Script to create a worklog entry on save of an SR
//    - worklog entry to be created only if the EXWORKLOGGER field is populated
//    - blank the exworklog field on successful creation of the worklog entry
//

var exworklog = mbo.getMboValue("EXWORKLOGGER");

if(exworklog != undefined && exworklog.isModified() && !exworklog.isNull() && exworklog.getString().length() > 0)
{
    try
    {
        //    get an empty worklog collection
        var worklogs = mbo.getMboSet("WORKLOG");
        worklogs.setWhere("1=0");
        worklogs.reset();

        //    get a title
        var title = getTitle(exworklog.getString());

        //    add a worklog entry to the collection
        var worklog = worklogs.add();

        //  Set default log type
        if (mbo.getMboValue("EXWORKLOGTYPE").isNull())
        {
          worklog.setValue("LOGTYPE","WORK");
        }
        else
        {
          worklog.setValue("LOGTYPE",mbo.getMboValue("EXWORKLOGTYPE"))
        }

        worklog.setValue("DESCRIPTION",title);
        worklog.setValue("DESCRIPTION_LONGDESCRIPTION",exworklog.getString());

        //    Clear the EXWORKLOGGER field
        exworklog.setValue("");
        mbo.setValue("EXWORKLOGTYPE","");

        //
        //    Update the Updated checkbox if edited by someone other than Owner
        //    Required here and farther down the script for 2 different cases
        //
        if (mbo.getMboValue("OWNER") != user)
        {
          mbo.setValue("EXUPDATED",1);
        }

        //    save the collection
        worklogs.save();
    }
    catch(ex)
    {
        //    display an error message to the user
        errorgroup = "error";
        errorkey = ex;
    }
    finally
    {
        //    close the collection
        if(worklogs != undefined)
        {
            worklogs.close();
        }
    }
}

//
//    Update the Updated checkbox if edited by someone other than Owner
//    Required here and farther up the script for 2 different cases
//
if (mbo.getMboValue("OWNER") != user)
{
  mbo.setValue("EXUPDATED",1);
}

//
//    Re-apply SLA if Priority or CI has changed
//
var newPriority = mbo.getString("INTERNALPRIORITY");
var oldPriority = mbo.getMboInitialValue("INTERNALPRIORITY").asString();
var newCI = mbo.getString("CINUM");
var oldCI = mbo.getMboInitialValue("CINUM").asString();

if ((!newPriority.equals(oldPriority)) || (!newCI.equals(oldCI)))
{
    println ("TRYING TO APPLY SLA");
    var slaRecordSet = mbo.getMboSet("REP_SLA");
    slaRecordSet.applySLA();
}

//    returns either
//    - the first line if it is shorter than 100 characters
//    - the first 100 characters if the first line is over 100 characters
//    - the text if the text is less than 100 character but has no line end
function getTitle(text)
{
    var line_end = text.indexOf('\n');

    if(line_end > 0 && line_end < 101)
    {
        return text.substring(0,line_end - 1);
    }

    if(text.length() > 100)
    {
        return text.substring(0,100);
    }

    return text;
}
